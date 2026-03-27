"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type RawVariationAttribute = {
  id?: number;
  name?: string;
  slug?: string;
  taxonomy?: string;
  option?: string;
  value?: string;
};

type RawVariation = {
  id?: number;
  price?: string | number;
  regular_price?: string | number;
  sale_price?: string | number;
  in_stock?: boolean;
  is_in_stock?: boolean;
  stock_status?: string;
  image?: { src?: string } | null;
  prices?: {
    price?: string | number;
    regular_price?: string | number;
    sale_price?: string | number;
    currency_minor_unit?: number;
  };
  attributes?: RawVariationAttribute[];
};

type Variation = {
  id: number;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  in_stock?: boolean;
  stock_status?: string;
  image?: { src: string } | null;
  attributes: { id?: number; name: string; slug?: string; option: string }[];
};

function norm(x: unknown) {
  return String(x ?? "").trim().toLowerCase();
}

function slugToLabel(value: unknown) {
  const clean = String(value ?? "").trim();
  if (!clean) return "";
  return clean
    .split("-")
    .map((part) =>
      part ? part.charAt(0).toUpperCase() + part.slice(1) : ""
    )
    .join(" ");
}

function formatMinorUnitPrice(
  raw: string | number | undefined,
  minorUnit = 2
): string {
  const n = Number(raw ?? 0);
  if (!Number.isFinite(n)) return "";
  return String(n / Math.pow(10, minorUnit));
}

function normalizeVariation(v: RawVariation): Variation | null {
  const id = Number(v?.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  const minorUnit = Number(v?.prices?.currency_minor_unit ?? 2);

  const price =
    v?.price !== undefined
      ? String(v.price)
      : v?.prices?.price !== undefined
        ? formatMinorUnitPrice(v.prices.price, minorUnit)
        : "";

  const regularPrice =
    v?.regular_price !== undefined
      ? String(v.regular_price)
      : v?.prices?.regular_price !== undefined
        ? formatMinorUnitPrice(v.prices.regular_price, minorUnit)
        : "";

  const salePrice =
    v?.sale_price !== undefined
      ? String(v.sale_price)
      : v?.prices?.sale_price !== undefined
        ? formatMinorUnitPrice(v.prices.sale_price, minorUnit)
        : "";

  const attributes = Array.isArray(v?.attributes)
    ? v.attributes
        .map((a) => {
          const option = String(a?.option ?? a?.value ?? "").trim();
          if (!option) return null;

          return {
            id: a?.id,
            name: String(a?.name ?? "").trim(),
            slug: String(a?.slug ?? a?.taxonomy ?? "").trim(),
            option,
          };
        })
        .filter(Boolean)
    : [];

  return {
    id,
    price,
    regular_price: regularPrice,
    sale_price: salePrice,
    in_stock:
      typeof v?.in_stock === "boolean"
        ? v.in_stock
        : typeof v?.is_in_stock === "boolean"
          ? v.is_in_stock
          : undefined,
    stock_status: String(v?.stock_status ?? "").trim(),
    image:
      v?.image?.src
        ? {
            src: String(v.image.src),
          }
        : null,
    attributes: attributes as Variation["attributes"],
  };
}

function getStock(v: Variation) {
  if (typeof v.in_stock === "boolean") return v.in_stock;
  return norm(v.stock_status) === "instock";
}

function findAttr(v: Variation, want: "color" | "size") {
  const slugWant = want === "color" ? "pa_color" : "pa_size";

  const bySlug = v.attributes?.find((a) => norm(a.slug) === slugWant);
  if (bySlug?.option) return bySlug.option;

  const byName =
    v.attributes?.find((a) => norm(a.name) === want) ||
    v.attributes?.find((a) => norm(a.name).includes(want));

  return byName?.option || "";
}

function comboKey(color: unknown, size: unknown) {
  return `${norm(color)}||${norm(size)}`;
}

type Props = {
  productId: number;
  colors?: string[];
  sizes?: string[];
  onResolved?: (
    v: Variation | null,
    sel: { color: string | null; size: string | null }
  ) => void;
};

function SectionLabel({
  title,
  onClear,
  canClear,
}: {
  title: string;
  onClear: () => void;
  canClear: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-[clamp(13px,3.2vw,15px)] font-semibold tracking-[-0.02em] text-neutral-900">
        {title}
      </div>

      {canClear ? (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex min-h-[30px] items-center justify-center rounded-full border border-black/8 bg-white/70 px-3 text-[11px] font-semibold text-neutral-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl transition hover:bg-white hover:text-neutral-900 active:scale-[0.985]"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

export default function VariantSelectorClient({
  productId,
  colors,
  sizes,
  onResolved,
}: Props) {
  const colorsProp = Array.isArray(colors) ? colors : [];
  const sizesProp = Array.isArray(sizes) ? sizes : [];

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [colorMapRaw, setColorMapRaw] = useState<Record<string, string>>({});

  const onResolvedSafe = useMemo(() => {
    return typeof onResolved === "function" ? onResolved : () => {};
  }, [onResolved]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setLoadError(null);

      try {
        const [vRes, cRes] = await Promise.all([
          fetch(`/api/products/${productId}/variations`, { cache: "no-store" }),
          fetch(`/api/color-map`, { cache: "no-store" }),
        ]);

        const vData = await vRes.json().catch(() => null);
        const cData = await cRes.json().catch(() => ({}));

        if (!alive) return;

        if (!vRes.ok) {
          setVariations([]);
          setColorMapRaw({});
          setLoadError(
            (vData && (vData.error || vData.message)) ||
              `Failed to load variations (${vRes.status})`
          );
          setLoading(false);
          return;
        }

        const normalized = Array.isArray(vData)
          ? vData.map(normalizeVariation).filter(Boolean)
          : [];

        setVariations(normalized as Variation[]);
        setColorMapRaw(cData && typeof cData === "object" ? cData : {});
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setVariations([]);
        setColorMapRaw({});
        setLoadError(e?.message || "Failed to load options.");
        setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [productId]);

  const colorMap = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(colorMapRaw || {})) {
      out[norm(k)] = String(v);
    }
    return out;
  }, [colorMapRaw]);

  const tables = useMemo(() => {
    const lookup = new Map<string, Variation>();

    const allColors = new Map<string, string>();
    const allSizes = new Map<string, string>();

    const colorToSizes = new Map<string, Set<string>>();
    const sizeToColors = new Map<string, Set<string>>();
    const comboInStock = new Map<string, boolean>();

    for (const v of variations) {
      const c = findAttr(v, "color");
      const s = findAttr(v, "size");
      const cN = norm(c);
      const sN = norm(s);

      if (!cN || !sN) continue;

      if (!allColors.has(cN)) allColors.set(cN, c);
      if (!allSizes.has(sN)) allSizes.set(sN, s);

      const k = comboKey(c, s);
      lookup.set(k, v);
      comboInStock.set(k, getStock(v));

      if (!colorToSizes.has(cN)) colorToSizes.set(cN, new Set());
      colorToSizes.get(cN)!.add(sN);

      if (!sizeToColors.has(sN)) sizeToColors.set(sN, new Set());
      sizeToColors.get(sN)!.add(cN);
    }

    return {
      lookup,
      allColors,
      allSizes,
      colorToSizes,
      sizeToColors,
      comboInStock,
    };
  }, [variations]);

  const { lookup, allColors, allSizes, colorToSizes, sizeToColors, comboInStock } =
    tables;

  const colorsList = useMemo(() => {
    if (colorsProp.length) return colorsProp;
    return Array.from(allColors.values());
  }, [colorsProp, allColors]);

  const sizesList = useMemo(() => {
    if (sizesProp.length) return sizesProp;
    return Array.from(allSizes.values());
  }, [sizesProp, allSizes]);

  const enabledColors = useMemo(() => {
    if (loading) return new Set<string>();
    if (!selectedSize) return new Set(Array.from(allColors.keys()));
    return sizeToColors.get(norm(selectedSize)) ?? new Set<string>();
  }, [loading, selectedSize, allColors, sizeToColors]);

  const enabledSizes = useMemo(() => {
    if (loading) return new Set<string>();
    if (!selectedColor) return new Set(Array.from(allSizes.keys()));
    return colorToSizes.get(norm(selectedColor)) ?? new Set<string>();
  }, [loading, selectedColor, allSizes, colorToSizes]);

  const pickFirstCompatibleSize = useCallback(
    (forColor: string): string | null => {
      const cN = norm(forColor);
      const sSet = colorToSizes.get(cN);
      if (!sSet || sSet.size === 0) return null;

      for (const s of sizesList) {
        if (sSet.has(norm(s))) return s;
      }

      const first = Array.from(sSet)[0];
      return allSizes.get(first) ?? null;
    },
    [colorToSizes, sizesList, allSizes]
  );

  const pickFirstCompatibleColor = useCallback(
    (forSize: string): string | null => {
      const sN = norm(forSize);
      const cSet = sizeToColors.get(sN);
      if (!cSet || cSet.size === 0) return null;

      for (const c of colorsList) {
        if (cSet.has(norm(c))) return c;
      }

      const first = Array.from(cSet)[0];
      return allColors.get(first) ?? null;
    },
    [sizeToColors, colorsList, allColors]
  );

  const onPickColor = useCallback(
    (c: string) => {
      if (loading) return;

      const cN = norm(c);
      if (!enabledColors.has(cN)) return;

      if (selectedSize) {
        const k = comboKey(c, selectedSize);
        if (!lookup.has(k)) {
          const nextSize = pickFirstCompatibleSize(c);
          setSelectedColor(c);
          setSelectedSize(nextSize);
          return;
        }
      }

      setSelectedColor(c);
    },
    [loading, enabledColors, selectedSize, lookup, pickFirstCompatibleSize]
  );

  const onPickSize = useCallback(
    (s: string) => {
      if (loading) return;

      const sN = norm(s);
      if (!enabledSizes.has(sN)) return;

      if (selectedColor) {
        const k = comboKey(selectedColor, s);
        if (!lookup.has(k)) {
          const nextColor = pickFirstCompatibleColor(s);
          setSelectedSize(s);
          setSelectedColor(nextColor);
          return;
        }
      }

      setSelectedSize(s);
    },
    [loading, enabledSizes, selectedColor, lookup, pickFirstCompatibleColor]
  );

  const current = useMemo(() => {
    if (!selectedColor || !selectedSize) return null;
    return lookup.get(comboKey(selectedColor, selectedSize)) ?? null;
  }, [lookup, selectedColor, selectedSize]);

  useEffect(() => {
    onResolvedSafe(current, { color: selectedColor, size: selectedSize });
  }, [onResolvedSafe, current, selectedColor, selectedSize]);

  const priceLabel =
    current?.price && Number.isFinite(Number(current.price))
      ? `৳ ${Number(current.price).toLocaleString("en-US")}`
      : null;

  const renderColorLabel = useCallback(
    (value: string) => {
      const key = norm(value);
      return slugToLabel(value) === value
        ? value
        : colorMap[key]
          ? value
          : slugToLabel(value);
    },
    [colorMap]
  );

  if (!loading && !loadError && colorsList.length === 0 && sizesList.length === 0) {
    return (
      <div className="mt-6 rounded-[clamp(16px,4vw,22px)] border border-black/8 bg-white/76 p-[clamp(10px,3vw,16px)] text-[clamp(11px,2.9vw,14px)] text-neutral-700 shadow-[0_10px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl">
        No variation options are available for this product right now.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-5 sm:space-y-6">
      <div className="space-y-2.5">
        <SectionLabel
          title="Color"
          canClear={!!selectedColor}
          onClear={() => setSelectedColor(null)}
        />

        <div className="flex flex-wrap gap-2">
          {colorsList.map((c) => {
            const cN = norm(c);
            const enabled = !loading && enabledColors.has(cN);
            const active = norm(selectedColor) === cN;
            const hex = colorMap[cN] || "#e5e7eb";

            const comboStock =
              selectedSize && enabled
                ? comboInStock.get(comboKey(c, selectedSize))
                : undefined;

            return (
              <button
                key={c}
                type="button"
                onClick={() => onPickColor(c)}
                aria-disabled={!enabled}
                className={[
                  "group inline-flex min-h-[42px] max-w-full min-w-0 items-center gap-2 rounded-full",
                  "border px-3 py-2 text-[12px] shadow-[0_8px_18px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl",
                  "transition duration-200 active:scale-[0.985]",
                  enabled
                    ? "border-black/8 bg-white/78 text-neutral-900 hover:bg-white"
                    : "border-black/5 bg-neutral-50/80 text-neutral-400",
                  active
                    ? "ring-2 ring-neutral-900/12 border-neutral-900/20 bg-white"
                    : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-4 w-4 shrink-0 rounded-full border border-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
                    comboStock === false ? "opacity-40" : "",
                  ].join(" ")}
                  style={{ backgroundColor: hex }}
                />
                <span className="truncate">{renderColorLabel(c)}</span>
                {comboStock === false ? (
                  <span className="shrink-0 text-[10px] font-semibold text-neutral-400">
                    (out)
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5">
        <SectionLabel
          title="Size"
          canClear={!!selectedSize}
          onClear={() => setSelectedSize(null)}
        />

        <div className="flex flex-wrap gap-2">
          {sizesList.map((s) => {
            const sN = norm(s);
            const enabled = !loading && enabledSizes.has(sN);
            const active = norm(selectedSize) === sN;

            const comboStock =
              selectedColor && enabled
                ? comboInStock.get(comboKey(selectedColor, s))
                : undefined;

            return (
              <button
                key={s}
                type="button"
                onClick={() => onPickSize(s)}
                aria-disabled={!enabled}
                className={[
                  "inline-flex min-h-[42px] max-w-full min-w-0 items-center justify-center rounded-[16px]",
                  "border px-3.5 py-2 text-[12px] font-semibold shadow-[0_8px_18px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl",
                  "transition duration-200 active:scale-[0.985]",
                  enabled
                    ? "border-black/8 bg-white/78 text-neutral-900 hover:bg-white"
                    : "border-black/5 bg-neutral-50/80 text-neutral-400",
                  active
                    ? "ring-2 ring-neutral-900/12 border-neutral-900/20 bg-white"
                    : "",
                  comboStock === false ? "opacity-60" : "",
                ].join(" ")}
              >
                <span className="truncate">{s}</span>
                {comboStock === false ? (
                  <span className="ml-1 shrink-0 text-[10px] font-semibold text-neutral-400">
                    (out)
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[clamp(16px,4vw,22px)] border border-black/8 bg-white/76 p-[clamp(10px,3vw,16px)] text-[clamp(11px,2.9vw,14px)] shadow-[0_10px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl">
        {loading ? (
          <div className="text-neutral-600">Loading options…</div>
        ) : loadError ? (
          <div className="text-neutral-700">{loadError}</div>
        ) : !selectedColor || !selectedSize ? (
          <div className="text-neutral-700">
            Select <span className="font-semibold text-neutral-900">color</span> and{" "}
            <span className="font-semibold text-neutral-900">size</span> to confirm
            availability.
          </div>
        ) : current ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="font-semibold text-neutral-900">
              {getStock(current) ? "In stock" : "Unavailable"}
            </div>
            <div className="font-semibold text-neutral-900">{priceLabel ?? "—"}</div>
          </div>
        ) : (
          <div className="text-neutral-700">This combination isn’t available.</div>
        )}
      </div>
    </div>
  );
}