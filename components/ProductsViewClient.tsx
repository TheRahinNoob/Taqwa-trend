"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProductCard, { WCProductLite } from "./ProductCard";

type SortKey = "latest" | "price_asc" | "price_desc" | "name_asc";

type CategoryOption = {
  slug: string;
  name: string;
  count?: number;
};

function norm(x: unknown) {
  return String(x ?? "").trim().toLowerCase();
}

function clampText(x: unknown) {
  return String(x ?? "").replace(/\s+/g, " ").trim();
}

function toFiniteNumber(x: string | null) {
  if (!x) return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function formatStoreApiPrice(prices: any) {
  const raw = Number(prices?.price ?? 0);
  const minorUnit = Number(prices?.currency_minor_unit ?? 2);

  if (!Number.isFinite(raw) || !Number.isFinite(minorUnit)) return "";

  const value = raw / Math.pow(10, minorUnit);

  if (!Number.isFinite(value)) return "";

  return value
    .toFixed(minorUnit)
    .replace(/\.00$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1");
}

function toStoreMinorUnit(value: number | null, minorUnit = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(value * Math.pow(10, minorUnit));
}

function sanitizeSort(value: string | null): SortKey {
  if (
    value === "latest" ||
    value === "price_asc" ||
    value === "price_desc" ||
    value === "name_asc"
  ) {
    return value;
  }

  return "latest";
}

function mapStoreProductToLite(p: any): WCProductLite | null {
  if (!p || !p.slug) return null;

  return {
    id: Number(p.id),
    name: String(p.name ?? ""),
    slug: String(p.slug ?? ""),
    price: formatStoreApiPrice(p?.prices),
    images: Array.isArray(p.images) ? p.images : [],
    categories: Array.isArray(p.categories) ? p.categories : [],
  };
}

function useDebounced<T>(value: T, delay = 240) {
  const [v, setV] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return v;
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
      <div className="aspect-[4/5] animate-pulse bg-black/10" />
      <div className="p-4">
        <div className="h-4 w-4/5 animate-pulse rounded bg-black/10" />
        <div className="mt-3 h-4 w-2/5 animate-pulse rounded bg-black/10" />
      </div>
    </div>
  );
}

export default function ProductsViewClient({
  initialProducts,
  allCategories,
}: {
  initialProducts: WCProductLite[];
  allCategories: CategoryOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const urlQ = sp.get("q") ?? "";
  const urlCat = sp.get("cat") ?? "all";
  const urlSort = sanitizeSort(sp.get("sort"));
  const urlMin = sp.get("min");
  const urlMax = sp.get("max");

  const [qInput, setQInput] = useState(urlQ);
  const q = useDebounced(qInput, 260);

  const [cat, setCat] = useState(urlCat);
  const [sort, setSort] = useState<SortKey>(urlSort);

  const [min, setMin] = useState<number | null>(toFiniteNumber(urlMin));
  const [max, setMax] = useState<number | null>(toFiniteNumber(urlMax));

  const [openFilters, setOpenFilters] = useState(false);

  const [items, setItems] = useState<WCProductLite[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reqIdRef = useRef(0);

  useEffect(() => {
    setQInput(urlQ);
    setCat(urlCat);
    setSort(urlSort);
    setMin(toFiniteNumber(urlMin));
    setMax(toFiniteNumber(urlMax));
  }, [urlQ, urlCat, urlSort, urlMin, urlMax]);

  const hasActive =
    qInput.trim() ||
    cat !== "all" ||
    sort !== "latest" ||
    typeof min === "number" ||
    typeof max === "number";

  const resetAll = () => {
    setQInput("");
    setCat("all");
    setSort("latest");
    setMin(null);
    setMax(null);
  };

  useEffect(() => {
    const params = new URLSearchParams();

    const qV = q.trim();
    if (qV) params.set("q", qV);
    if (cat !== "all") params.set("cat", cat);
    if (sort !== "latest") params.set("sort", sort);
    if (typeof min === "number") params.set("min", String(min));
    if (typeof max === "number") params.set("max", String(max));

    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [q, cat, sort, min, max, router, pathname]);

  useEffect(() => {
    const controller = new AbortController();
    const reqId = ++reqIdRef.current;

    async function run() {
      setIsLoading(true);
      setLoadError(null);

      const params = new URLSearchParams();
      const qV = q.trim();

      if (qV) params.set("q", qV);
      if (cat !== "all") params.set("cat", cat);
      if (sort !== "latest") params.set("sort", sort);

      const minMinor = toStoreMinorUnit(min);
      const maxMinor = toStoreMinorUnit(max);

      if (typeof minMinor === "number") params.set("min", String(minMinor));
      if (typeof maxMinor === "number") params.set("max", String(maxMinor));

      const url = `/api/products${params.toString() ? `?${params.toString()}` : ""}`;

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const msg =
            (data && (data.error || data.message)) ||
            `Failed to load products (${res.status})`;
          throw new Error(msg);
        }

        if (reqIdRef.current !== reqId) return;

        const arr = Array.isArray(data) ? data : [];
        const next = arr.map(mapStoreProductToLite).filter(Boolean) as WCProductLite[];

        setItems(next);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        if (reqIdRef.current !== reqId) return;
        setLoadError(e?.message || "Failed to load products.");
      } finally {
        if (reqIdRef.current === reqId) setIsLoading(false);
      }
    }

    run();
    return () => controller.abort();
  }, [q, cat, sort, min, max]);

  const visibleCounts = useMemo(() => {
    const map = new Map<string, number>();

    for (const p of items) {
      for (const c of p.categories ?? []) {
        const slug = clampText(c.slug);
        if (!slug) continue;
        map.set(slug, (map.get(slug) ?? 0) + 1);
      }
    }

    return map;
  }, [items]);

  const categories = useMemo(() => {
    const clean = allCategories
      .map((c) => ({
        slug: clampText(c.slug),
        name: clampText(c.name),
        count: Number.isFinite(Number(c.count)) ? Number(c.count) : 0,
      }))
      .filter((c) => c.slug && c.name)
      .sort((a, b) => a.name.localeCompare(b.name));

    return [
      {
        slug: "all",
        name: "All",
        visibleCount: items.length,
      },
      ...clean.map((c) => ({
        slug: c.slug,
        name: c.name,
        visibleCount: visibleCounts.get(c.slug) ?? 0,
      })),
    ];
  }, [allCategories, items.length, visibleCounts]);

  return (
    <div className="mt-4 sm:mt-6">
      <div className="sticky top-3 z-20">
        <div className="rounded-3xl border border-black/10 bg-white/75 p-3 shadow-sm backdrop-blur sm:p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-neutral-400">
                ⌕
              </div>

              {qInput.trim() ? (
                <button
                  type="button"
                  onClick={() => setQInput("")}
                  className="absolute inset-y-0 right-2 my-auto inline-flex h-8 items-center rounded-xl px-3 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 active:scale-[0.98]"
                >
                  Clear
                </button>
              ) : null}

              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Search Taqwa Trend…"
                className="h-11 w-full rounded-2xl border border-black/10 bg-white/70 pl-9 pr-16 text-sm text-neutral-900 outline-none transition focus:border-black/20 focus:bg-white focus:shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
              />
            </div>

            <button
              type="button"
              onClick={() => setOpenFilters(true)}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-neutral-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.98]"
            >
              Filters
              {hasActive ? (
                <span className="inline-flex h-2 w-2 rounded-full bg-white/80" />
              ) : null}
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((c) => {
              const active = norm(cat) === norm(c.slug);

              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setCat(c.slug)}
                  className={[
                    "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98]",
                    active
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "border border-black/10 bg-white text-neutral-900 hover:bg-neutral-50",
                  ].join(" ")}
                >
                  {c.name}
                  <span
                    className={[
                      "ml-2 rounded-full px-2 py-0.5 text-[11px]",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-neutral-100 text-neutral-600",
                    ].join(" ")}
                  >
                    {c.visibleCount}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 hidden items-end gap-3 sm:flex">
            <div className="flex-1">
              <div className="text-xs font-medium text-neutral-600">Min price</div>
              <input
                inputMode="decimal"
                value={min ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (!v) return setMin(null);
                  const n = Number(v);
                  setMin(Number.isFinite(n) ? n : null);
                }}
                className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-black/20"
              />
            </div>

            <div className="flex-1">
              <div className="text-xs font-medium text-neutral-600">Max price</div>
              <input
                inputMode="decimal"
                value={max ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (!v) return setMax(null);
                  const n = Number(v);
                  setMax(Number.isFinite(n) ? n : null);
                }}
                className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-black/20"
              />
            </div>

            <div className="w-[210px]">
              <div className="text-xs font-medium text-neutral-600">Sort</div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-black/20"
              >
                <option value="latest">Latest</option>
                <option value="name_asc">Name (A → Z)</option>
                <option value="price_asc">Price (Low → High)</option>
                <option value="price_desc">Price (High → Low)</option>
              </select>
            </div>

            {hasActive ? (
              <button
                type="button"
                onClick={resetAll}
                className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 active:scale-[0.98]"
              >
                Reset
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div className="font-semibold">Couldn’t load products</div>
          <div className="mt-1 text-xs opacity-80">{loadError}</div>
        </div>
      ) : null}

      <div className="mt-4 text-sm text-neutral-600">
        Showing{" "}
        <span className="font-semibold text-neutral-900">{items.length}</span>{" "}
        product{items.length === 1 ? "" : "s"}
        {hasActive ? <span className="text-neutral-500"> • filtered</span> : null}
        {isLoading ? <span className="ml-2 text-neutral-500">• loading</span> : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
          : items.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>

      {!isLoading && items.length === 0 && (
        <div className="mt-10 rounded-3xl border border-dashed border-black/15 bg-white p-10 text-center shadow-sm">
          <div className="text-base font-semibold text-neutral-900">
            No products found
          </div>
          <div className="mt-1 text-sm text-neutral-600">
            Try another search, category, or price range.
          </div>
          <div className="mt-5">
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.98]"
            >
              Reset filters →
            </button>
          </div>
        </div>
      )}

      {openFilters ? (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            onClick={() => setOpenFilters(false)}
            aria-label="Close filters"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-black/10 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-neutral-900">Filters</div>
              <button
                type="button"
                onClick={() => setOpenFilters(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 active:scale-[0.98]"
              >
                Done
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <div>
                <div className="text-xs font-medium text-neutral-600">Sort</div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-black/20"
                >
                  <option value="latest">Latest</option>
                  <option value="name_asc">Name (A → Z)</option>
                  <option value="price_asc">Price (Low → High)</option>
                  <option value="price_desc">Price (High → Low)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-medium text-neutral-600">Min</div>
                  <input
                    inputMode="decimal"
                    value={min ?? ""}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (!v) return setMin(null);
                      const n = Number(v);
                      setMin(Number.isFinite(n) ? n : null);
                    }}
                    className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-black/20"
                  />
                </div>
                <div>
                  <div className="text-xs font-medium text-neutral-600">Max</div>
                  <input
                    inputMode="decimal"
                    value={max ?? ""}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (!v) return setMax(null);
                      const n = Number(v);
                      setMax(Number.isFinite(n) ? n : null);
                    }}
                    className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-black/20"
                  />
                </div>
              </div>

              {hasActive ? (
                <button
                  type="button"
                  onClick={resetAll}
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 active:scale-[0.98]"
                >
                  Reset all
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setOpenFilters(false)}
                className="h-11 w-full rounded-2xl bg-neutral-900 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.98]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}