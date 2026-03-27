"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type HeaderCategory = {
  id?: number;
  slug: string;
  name: string;
  count?: number;
};

type CartResponse = {
  items_count?: number;
  items?: Array<{ quantity?: number }>;
};

function norm(x: unknown) {
  return String(x ?? "").trim().toLowerCase();
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BagIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 8.5h12l-1 10.5a2 2 0 0 1-1.99 1.8H8.99A2 2 0 0 1 7 19L6 8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 9V7a3 3 0 1 1 6 0v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparklesIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3l1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 14.5l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1ZM5.5 14.5l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlassButton({
  href,
  children,
  className,
  onClick,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-white/70 bg-white/68 text-neutral-900 shadow-[0_10px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-2xl transition duration-200 hover:bg-white active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/15",
        className
      )}
    >
      {children}
    </Link>
  );
}

function DarkButton({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-neutral-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] transition duration-200 hover:bg-neutral-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20",
        className
      )}
    >
      {children}
    </Link>
  );
}

function NavPill({
  href,
  label,
  active,
  dark = false,
  onClick,
  icon,
}: {
  href: string;
  label: string;
  active?: boolean;
  dark?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  if (dark) {
    return (
      <DarkButton href={href} onClick={onClick} className="h-10 gap-2 px-4 text-sm font-semibold">
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <span>{label}</span>
      </DarkButton>
    );
  }

  return (
    <GlassButton
      href={href}
      onClick={onClick}
      className={cn(
        "h-10 gap-2 px-4 text-sm font-semibold",
        active && "border-black/10 bg-white"
      )}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span>{label}</span>
    </GlassButton>
  );
}

function CategoryChip({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 active:scale-[0.98]",
        active
          ? "bg-neutral-950 text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)]"
          : "border border-white/70 bg-white/70 text-neutral-900 shadow-[0_10px_22px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-2xl hover:bg-white"
      )}
    >
      <span className="truncate">{label}</span>
      <span
        className={cn(
          "grid h-5 w-5 place-items-center rounded-full transition",
          active ? "bg-white/15 text-white" : "bg-neutral-100 text-neutral-500"
        )}
      >
        <ChevronRightIcon className="h-3 w-3" />
      </span>
    </Link>
  );
}

function CartCountBadge({
  count,
  compact = false,
}: {
  count: number;
  compact?: boolean;
}) {
  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold tracking-[-0.02em]",
        compact
          ? "min-w-[20px] px-1.5 py-0.5 text-[10px]"
          : "min-w-[22px] px-1.5 py-0.5 text-[11px]",
        count > 0
          ? "border border-neutral-900/10 bg-neutral-950 text-white shadow-[0_6px_16px_rgba(15,23,42,0.18)]"
          : "border border-black/6 bg-neutral-100 text-neutral-600"
      )}
    >
      {label}
    </span>
  );
}

function CartButton({
  count,
  mobile = false,
}: {
  count: number;
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <Link
        href="/cart"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/68 text-neutral-900 shadow-[0_10px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-2xl transition duration-200 active:scale-[0.98]"
        aria-label="Cart"
      >
        <BagIcon className="h-[18px] w-[18px]" />
        <span className="absolute -right-0.5 -top-0.5">
          <CartCountBadge count={count} compact />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/cart"
      className="group relative inline-flex h-11 items-center justify-center gap-3 rounded-full border border-white/70 bg-white/68 pl-3 pr-3.5 text-sm font-semibold text-neutral-900 shadow-[0_10px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-2xl transition duration-200 hover:bg-white active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/15"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-neutral-950 text-white shadow-[0_8px_20px_rgba(15,23,42,0.14)] transition duration-200 group-hover:bg-neutral-800">
        <BagIcon className="h-[16px] w-[16px]" />
      </span>
      <span>Cart</span>
      <CartCountBadge count={count} />
    </Link>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState(sp.get("q") ?? "");
  const [categories, setCategories] = useState<HeaderCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  const isProducts = pathname.startsWith("/products");
  const currentCat = sp.get("cat") ?? "";

  useEffect(() => {
    setSearch(sp.get("q") ?? "");
  }, [sp]);

  useEffect(() => {
    let alive = true;

    async function loadCategories() {
      setCategoriesLoading(true);

      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        const data = await res.json().catch(() => null);

        if (!alive) return;

        if (!res.ok || !Array.isArray(data)) {
          setCategories([]);
          setCategoriesLoading(false);
          return;
        }

        const next = data
          .map((c: any) => ({
            id: typeof c?.id === "number" ? c.id : Number(c?.id),
            slug: String(c?.slug ?? "").trim(),
            name: String(c?.name ?? "").trim(),
            count:
              typeof c?.count === "number"
                ? c.count
                : Number.isFinite(Number(c?.count))
                ? Number(c.count)
                : 0,
          }))
          .filter((c: HeaderCategory) => c.slug && c.name)
          .sort((a: HeaderCategory, b: HeaderCategory) => a.name.localeCompare(b.name));

        setCategories(next);
      } catch {
        if (!alive) return;
        setCategories([]);
      } finally {
        if (alive) setCategoriesLoading(false);
      }
    }

    loadCategories();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadCartCount() {
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        const data: CartResponse | null = await res.json().catch(() => null);

        if (!alive || !res.ok || !data) return;

        const nextCount =
          typeof data.items_count === "number"
            ? data.items_count
            : Array.isArray(data.items)
            ? data.items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0)
            : 0;

        setCartCount(nextCount);
      } catch {
        if (!alive) return;
        setCartCount(0);
      }
    }

    loadCartCount();

    const onFocus = () => loadCartCount();
    const onVisibility = () => {
      if (document.visibilityState === "visible") loadCartCount();
    };
    const onCartChanged = () => loadCartCount();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("cart-updated", onCartChanged as EventListener);

    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("cart-updated", onCartChanged as EventListener);
    };
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const visibleCategories = useMemo(() => categories.slice(0, 10), [categories]);

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/55 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/50">
        <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-8">
          <div className="flex h-16 items-center gap-2.5 sm:h-[72px] sm:gap-3">
            <Link
              href="/"
              aria-label="Go to homepage"
              className="group inline-flex min-w-0 items-center gap-2.5 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/15"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[18px] bg-neutral-950 text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)] transition duration-200 group-hover:bg-neutral-800 sm:h-11 sm:w-11">
                <span className="text-sm font-semibold tracking-tight">T</span>
              </span>

              <div className="min-w-0 leading-tight">
                <div className="truncate text-[15px] font-semibold tracking-[-0.03em] text-neutral-950 sm:text-[16px]">
                  TaqwaTrend
                </div>
                <div className="hidden truncate text-xs text-neutral-500 sm:block">
                  Premium modestwear
                </div>
              </div>
            </Link>

            <form
              onSubmit={onSubmitSearch}
              className="ml-2 hidden min-w-0 flex-1 lg:block"
              role="search"
            >
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-neutral-400">
                  <SearchIcon />
                </div>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search abaya, hijab, niqab…"
                  className="h-12 w-full rounded-full border border-white/70 bg-white/68 pl-11 pr-24 text-sm text-neutral-900 outline-none shadow-[0_10px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-2xl transition duration-200 placeholder:text-neutral-400 focus:border-black/10 focus:bg-white"
                />

                <button
                  type="submit"
                  className="absolute right-2 top-2 inline-flex h-8 items-center justify-center rounded-full bg-neutral-950 px-4 text-xs font-semibold text-white transition duration-200 hover:bg-neutral-800 active:scale-[0.98]"
                >
                  Search
                </button>
              </div>
            </form>

            <nav className="ml-auto hidden items-center gap-2 lg:flex">
              <NavPill href="/products" label="Shop" active={isProducts && !currentCat} />
              <NavPill
                href="/products?sort=featured"
                label="New"
                icon={<SparklesIcon className="h-4 w-4" />}
              />
              <CartButton count={cartCount} />
              <NavPill href="/products" label="Browse" dark />
            </nav>

            <div className="ml-auto flex items-center gap-2 lg:hidden">
              <GlassButton href="/products" className="h-11 px-4 text-sm font-semibold">
                Shop
              </GlassButton>

              <CartButton count={cartCount} mobile />

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)] transition duration-200 active:scale-[0.98]"
                aria-label="Open menu"
              >
                <MenuIcon />
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="pb-3">
              <div className="rounded-[28px] border border-white/70 bg-white/56 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      Collections
                    </div>
                    <div className="mt-1 text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                      Explore by category
                    </div>
                  </div>

                  <GlassButton
                    href="/products"
                    className="h-10 shrink-0 gap-2 px-4 text-sm font-semibold"
                  >
                    <span>See all</span>
                    <ChevronRightIcon className="h-4 w-4" />
                  </GlassButton>
                </div>

                <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <CategoryChip href="/products" label="All collections" active={!currentCat} />

                  {categoriesLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-[46px] w-32 shrink-0 animate-pulse rounded-full border border-white/70 bg-white/70"
                      />
                    ))
                  ) : (
                    visibleCategories.map((cat) => {
                      const active = norm(currentCat) === norm(cat.slug);
                      return (
                        <CategoryChip
                          key={cat.slug}
                          href={`/products?cat=${encodeURIComponent(cat.slug)}`}
                          label={cat.name}
                          active={active}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/30 transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
        />

        <div
          className={cn(
            "absolute inset-x-0 top-0 rounded-b-[30px] border-b border-white/70 bg-white/82 shadow-2xl backdrop-blur-2xl",
            "transition-transform duration-300 ease-out",
            mobileOpen ? "translate-y-0" : "-translate-y-[105%]"
          )}
        >
          <div className="mx-auto max-w-7xl px-3 pb-5 pt-3 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex min-w-0 items-center gap-2.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[18px] bg-neutral-950 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)]">
                  T
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold tracking-[-0.03em] text-neutral-950">
                    TaqwaTrend
                  </div>
                  <div className="truncate text-xs text-neutral-500">Premium modestwear</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/72 text-neutral-900 shadow-[0_10px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-2xl transition duration-200 active:scale-[0.98]"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={onSubmitSearch} className="mt-4" role="search">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-neutral-400">
                  <SearchIcon />
                </div>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products…"
                  className="h-12 w-full rounded-full border border-white/70 bg-white/74 pl-11 pr-20 text-sm text-neutral-900 outline-none shadow-[0_10px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-2xl transition duration-200 placeholder:text-neutral-400 focus:border-black/10 focus:bg-white"
                />

                <button
                  type="submit"
                  className="absolute right-2 top-2 inline-flex h-8 items-center justify-center rounded-full bg-neutral-950 px-4 text-xs font-semibold text-white transition duration-200 active:scale-[0.98]"
                >
                  Go
                </button>
              </div>
            </form>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <NavPill
                href="/products"
                label="Shop"
                active={isProducts && !currentCat}
                onClick={() => setMobileOpen(false)}
              />
              <NavPill href="/products" label="Browse" dark onClick={() => setMobileOpen(false)} />
            </div>

            <div className="mt-5 rounded-[26px] border border-white/70 bg-white/70 p-3.5 shadow-[0_12px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Collections
              </div>
              <div className="mt-1 text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                Explore by category
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 min-[280px]:grid-cols-2">
                <CategoryChip
                  href="/products"
                  label="All collections"
                  active={!currentCat}
                  onClick={() => setMobileOpen(false)}
                />

                {categoriesLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[46px] animate-pulse rounded-full border border-white/70 bg-white/72"
                    />
                  ))
                ) : (
                  categories.map((cat) => {
                    const active = norm(currentCat) === norm(cat.slug);
                    return (
                      <CategoryChip
                        key={cat.slug}
                        href={`/products?cat=${encodeURIComponent(cat.slug)}`}
                        label={cat.name}
                        active={active}
                        onClick={() => setMobileOpen(false)}
                      />
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2 min-[280px]:grid-cols-2">
              <GlassButton
                href="/cart"
                onClick={() => setMobileOpen(false)}
                className="min-h-[46px] gap-2 px-4 text-sm font-semibold"
              >
                <BagIcon />
                <span>Cart</span>
                <CartCountBadge count={cartCount} />
              </GlassButton>

              <DarkButton
                href="/products?sort=featured"
                onClick={() => setMobileOpen(false)}
                className="min-h-[46px] gap-2 px-4 text-sm font-semibold"
              >
                <SparklesIcon className="h-4 w-4" />
                <span>New arrivals</span>
              </DarkButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}