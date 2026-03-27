"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";

type CartTotals = {
  total_items?: string | number | null;
  total_items_tax?: string | number | null;
  total_fees?: string | number | null;
  total_fees_tax?: string | number | null;
  total_discount?: string | number | null;
  total_discount_tax?: string | number | null;
  total_shipping?: string | number | null;
  total_shipping_tax?: string | number | null;
  total_price?: string | number | null;
  total_tax?: string | number | null;
  currency_code?: string;
  currency_symbol?: string;
  currency_minor_unit?: number;
  currency_decimal_separator?: string;
  currency_thousand_separator?: string;
  currency_prefix?: string;
  currency_suffix?: string;
};

type CartImage = {
  src?: string;
  thumbnail?: string;
  alt?: string;
  name?: string;
};

type CartItem = {
  key?: string;
  id?: number;
  name?: string;
  quantity?: number;
  short_description?: string;
  description?: string;
  permalink?: string;
  sku?: string;
  images?: CartImage[];
  variation?: Array<{ attribute?: string; value?: string }>;
  item_data?: Array<{ key?: string; value?: string }>;
  prices?: {
    price?: string | number | null;
    regular_price?: string | number | null;
    sale_price?: string | number | null;
    currency_code?: string;
    currency_symbol?: string;
    currency_minor_unit?: number;
    currency_decimal_separator?: string;
    currency_thousand_separator?: string;
    currency_prefix?: string;
    currency_suffix?: string;
  };
  totals?: {
    line_total?: string | number | null;
    line_total_tax?: string | number | null;
    currency_code?: string;
    currency_symbol?: string;
    currency_minor_unit?: number;
    currency_decimal_separator?: string;
    currency_thousand_separator?: string;
    currency_prefix?: string;
    currency_suffix?: string;
  };
};

type CartResponse = {
  items?: CartItem[];
  coupons?: any[];
  fees?: any[];
  totals?: CartTotals;
  shipping_address?: Record<string, any>;
  billing_address?: Record<string, any>;
  needs_payment?: boolean;
  needs_shipping?: boolean;
  payment_requirements?: string[];
  has_calculated_shipping?: boolean;
  shipping_rates?: any[];
  items_count?: number;
  items_weight?: number;
  cross_sells?: any[];
  errors?: any[];
  payment_methods?: string[];
  extensions?: Record<string, any>;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizeBaseUrl(input: string) {
  let base = String(input || "").trim();
  if (base && !/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base.replace(/\/+$/, "");
}

function normalizePublicWpUrl(url?: string | null) {
  const raw = String(url ?? "").trim();
  if (!raw) return "";

  const publicWpBase = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_WORDPRESS_URL || ""
  );

  if (!publicWpBase) return raw;

  const localBases = [
    "https://taqwatrend.local",
    "http://taqwatrend.local",
    "https://localhost",
    "http://localhost",
    "https://127.0.0.1",
    "http://127.0.0.1",
  ];

  for (const localBase of localBases) {
    if (raw.startsWith(localBase)) {
      return `${publicWpBase}${raw.slice(localBase.length)}`;
    }
  }

  return raw;
}

function CartIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 7.5h16l-1.2 10.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L4 7.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 9.5V7a3 3 0 1 1 6 0v2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RefreshIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M20 11a8 8 0 1 0 1.2 4.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M20 4v6h-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MinusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 7h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M9.5 4h5a1 1 0 0 1 1 1v2h-7V5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8 10v7m4-7v7m4-7v7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6 7l.7 11a2 2 0 0 0 2 1.9h6.6a2 2 0 0 0 2-1.9L18 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 12h14m0 0-5-5m5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3l7 3.2V11c0 4.3-2.5 8.3-7 10-4.5-1.7-7-5.7-7-10V6.2L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m9.2 12 1.8 1.8 3.8-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function toMinorNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatMinorAmount(
  value: unknown,
  meta?: {
    currency_symbol?: string;
    currency_minor_unit?: number;
    currency_prefix?: string;
    currency_suffix?: string;
  }
) {
  const minor = typeof meta?.currency_minor_unit === "number" ? meta.currency_minor_unit : 2;
  const n = toMinorNumber(value) / Math.pow(10, minor);

  const formatted = n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: minor,
  });

  const prefix =
    typeof meta?.currency_prefix === "string" && meta.currency_prefix.length > 0
      ? meta.currency_prefix
      : "";

  const suffix =
    typeof meta?.currency_suffix === "string" && meta.currency_suffix.length > 0
      ? meta.currency_suffix
      : "";

  const symbol = !prefix && !suffix ? String(meta?.currency_symbol ?? "৳ ") : "";

  return `${prefix}${symbol}${formatted}${suffix}`.trim();
}

function stripHtml(html: unknown) {
  return String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCartImage(img?: CartImage | null): CartImage {
  return {
    ...img,
    src: normalizePublicWpUrl(String(img?.src ?? "")),
    thumbnail: normalizePublicWpUrl(String(img?.thumbnail ?? "")),
    alt: String(img?.alt ?? ""),
    name: String(img?.name ?? ""),
  };
}

function normalizeCartItem(item: CartItem): CartItem {
  return {
    ...item,
    permalink: normalizePublicWpUrl(String(item?.permalink ?? "")),
    images: Array.isArray(item.images)
      ? item.images.map((img) => normalizeCartImage(img))
      : [],
  };
}

function normalizeCartResponse(data: CartResponse | null): CartResponse | null {
  if (!data || typeof data !== "object") return data;

  return {
    ...data,
    items: Array.isArray(data.items) ? data.items.map(normalizeCartItem) : [],
  };
}

function itemImage(item: CartItem) {
  const img = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null;
  return img?.thumbnail || img?.src || "";
}

function itemAlt(item: CartItem) {
  const img = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null;
  return img?.alt || img?.name || item.name || "Cart item";
}

function itemVariantText(item: CartItem) {
  const fromVariation = Array.isArray(item.variation)
    ? item.variation
        .map((x) => {
          const attr = String(x?.attribute ?? "").trim();
          const value = String(x?.value ?? "").trim();
          return attr && value ? `${attr}: ${value}` : "";
        })
        .filter(Boolean)
    : [];

  const fromItemData = Array.isArray(item.item_data)
    ? item.item_data
        .map((x) => {
          const key = String(x?.key ?? "").trim();
          const value = stripHtml(x?.value ?? "");
          return key && value ? `${key}: ${value}` : "";
        })
        .filter(Boolean)
    : [];

  return [...fromVariation, ...fromItemData].join(" • ");
}

function GlassPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[26px] border border-white/60 bg-white/[0.62] shadow-[0_10px_30px_rgba(15,23,42,0.06),0_2px_10px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/90",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))]" />
      <div className="relative">{children}</div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div
        className={cn(
          strong
            ? "text-[14px] font-semibold tracking-[-0.02em] text-neutral-950"
            : "text-[13px] font-medium tracking-[-0.01em] text-neutral-600 sm:text-[14px]"
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          strong
            ? "text-[16px] font-semibold tracking-[-0.03em] text-neutral-950"
            : "text-[13px] font-semibold tracking-[-0.01em] text-neutral-900 sm:text-[14px]"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function MiniBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-full border border-white/70 bg-white/72 px-3 py-1.5 text-[11px] font-semibold tracking-[-0.01em] text-neutral-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.98)] sm:text-[12px]",
        className
      )}
    >
      {children}
    </div>
  );
}

const CartCard = memo(function CartCard({
  item,
  busy,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  item: CartItem;
  busy: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
}) {
  const image = itemImage(item);
  const lineTotal = formatMinorAmount(
    item?.totals?.line_total ?? item?.prices?.price ?? 0,
    item?.totals ?? item?.prices
  );
  const unitPrice = formatMinorAmount(item?.prices?.price ?? 0, item?.prices);
  const variantText = itemVariantText(item);
  const description = stripHtml(item.short_description || item.description || "");
  const quantity = Math.max(1, Number(item.quantity || 1));

  return (
    <GlassPanel className="p-3.5 sm:p-4.5 lg:p-5">
      <div className="grid grid-cols-[82px_minmax(0,1fr)] gap-3.5 min-[380px]:grid-cols-[92px_minmax(0,1fr)] sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-5">
        <div className="relative overflow-hidden rounded-[22px] border border-white/70 bg-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.98)]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={itemAlt(item)}
              className="aspect-[4/5] h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="aspect-[4/5] h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.08),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.05),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(245,245,245,0.95))]" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="line-clamp-2 text-[15px] font-semibold leading-[1.2] tracking-[-0.03em] text-neutral-950 sm:text-[17px]">
                {item.name || "Cart item"}
              </div>

              {variantText ? (
                <div className="mt-1.5 line-clamp-2 text-[12px] font-medium leading-5 text-neutral-600 sm:text-[13px]">
                  {variantText}
                </div>
              ) : null}

              {!variantText && description ? (
                <div className="mt-1.5 line-clamp-2 text-[12px] font-medium leading-5 text-neutral-600 sm:text-[13px]">
                  {description}
                </div>
              ) : null}
            </div>

            <div className="shrink-0 rounded-full border border-white/70 bg-white/74 px-3 py-1.5 text-[11px] font-semibold tracking-[-0.01em] text-neutral-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.98)] sm:text-[12px]">
              {lineTotal}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <MiniBadge>Unit: {unitPrice}</MiniBadge>
            {item.sku ? <MiniBadge className="text-neutral-600">SKU: {item.sku}</MiniBadge> : null}
          </div>

          <div className="mt-4 flex flex-col gap-2.5 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
            <div className="inline-flex w-full min-[360px]:w-auto items-center rounded-[18px] border border-white/70 bg-white/72 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
              <button
                type="button"
                onClick={onDecrease}
                disabled={busy || quantity <= 1}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-neutral-950 transition duration-200 hover:bg-black/[0.04] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <MinusIcon />
              </button>

              <div className="min-w-[50px] text-center text-[15px] font-semibold tracking-[-0.02em] text-neutral-950">
                {quantity}
              </div>

              <button
                type="button"
                onClick={onIncrease}
                disabled={busy}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-neutral-950 transition duration-200 hover:bg-black/[0.04] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <PlusIcon />
              </button>
            </div>

            <button
              type="button"
              onClick={onRemove}
              disabled={busy}
              className="inline-flex min-h-[44px] w-full min-[360px]:w-auto items-center justify-center gap-2 rounded-[18px] border border-white/70 bg-white/72 px-4 py-2 text-[12px] font-semibold tracking-[-0.01em] text-neutral-950 shadow-[inset_0_1px_0_rgba(255,255,255,1)] transition duration-200 hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <TrashIcon />
              {busy ? "Working..." : "Remove"}
            </button>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
});

function LoadingCard() {
  return (
    <GlassPanel className="p-3.5 sm:p-4.5 lg:p-5">
      <div className="grid grid-cols-[82px_minmax(0,1fr)] gap-3.5 min-[380px]:grid-cols-[92px_minmax(0,1fr)] sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-5">
        <div className="aspect-[4/5] animate-pulse rounded-[22px] bg-black/7" />
        <div className="py-1">
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-black/7" />
          <div className="mt-3 h-3 w-1/2 animate-pulse rounded-full bg-black/7" />
          <div className="mt-5 h-10 w-28 animate-pulse rounded-2xl bg-black/7" />
          <div className="mt-4 h-10 w-24 animate-pulse rounded-2xl bg-black/7" />
        </div>
      </div>
    </GlassPanel>
  );
}

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const loadCart = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      setError("");

      const res = await fetch("/api/cart", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || data?.details?.message || "Failed to load cart"
        );
      }

      setCart(normalizeCartResponse(data));
    } catch (e: any) {
      setError(e?.message || "Failed to load cart");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const items = useMemo(() => (Array.isArray(cart?.items) ? cart.items : []), [cart]);
  const totals = cart?.totals ?? {};

  const itemsCount = useMemo(() => {
    if (typeof cart?.items_count === "number") return cart.items_count;
    return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [cart?.items_count, items]);

  const subtotalLabel = useMemo(() => formatMinorAmount(totals.total_items, totals), [totals]);
  const discountLabel = useMemo(
    () => formatMinorAmount(totals.total_discount, totals),
    [totals]
  );
  const shippingLabel = useMemo(() => {
    return totals.total_shipping == null
      ? "Calculated at checkout"
      : formatMinorAmount(totals.total_shipping, totals);
  }, [totals]);
  const totalLabel = useMemo(() => formatMinorAmount(totals.total_price, totals), [totals]);

  async function updateQuantity(key: string, quantity: number) {
    if (!key || quantity < 1) return;

    try {
      setBusyKey(key);
      setError("");

      const res = await fetch("/api/cart/update-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key, quantity }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || data?.details?.message || "Failed to update quantity"
        );
      }

      setCart(normalizeCartResponse(data));
    } catch (e: any) {
      setError(e?.message || "Failed to update quantity");
    } finally {
      setBusyKey("");
    }
  }

  async function removeItem(key: string) {
    if (!key) return;

    try {
      setBusyKey(key);
      setError("");

      const res = await fetch("/api/cart/remove-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || data?.details?.message || "Failed to remove item"
        );
      }

      setCart(normalizeCartResponse(data));
    } catch (e: any) {
      setError(e?.message || "Failed to remove item");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-[#edf1f5] text-neutral-950 antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f9fbfd_0%,#edf1f5_46%,#e8edf3_100%)]" />
        <div className="absolute left-[-18%] top-[-8%] h-[20rem] w-[20rem] rounded-full bg-white/80 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        <div className="absolute right-[-15%] top-[4%] h-[18rem] w-[18rem] rounded-full bg-white/70 blur-3xl sm:h-[24rem] sm:w-[24rem]" />
        <div className="absolute bottom-[-12%] left-1/2 h-[20rem] w-[20rem] -translate-x-1/2 rounded-full bg-white/60 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        <div className="absolute inset-0 opacity-[0.045] [background-image:radial-gradient(circle_at_1px_1px,rgba(17,24,39,0.55)_1px,transparent_0)] [background-size:20px_20px]" />
      </div>

      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl px-3 pb-32 pt-3 sm:px-5 sm:pb-28 sm:pt-6 lg:px-8 lg:pb-20">
        <section className="mb-4 sm:mb-6">
          <GlassPanel className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/72 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600 shadow-[inset_0_1px_0_rgba(255,255,255,1)] sm:text-[11px]">
                  <CartIcon className="h-4 w-4" />
                  Shopping bag
                </div>

                <h1 className="mt-3 max-w-3xl text-[clamp(28px,9vw,58px)] font-semibold leading-[0.94] tracking-[-0.07em] text-neutral-950">
                  Your bag,
                  <span className="mt-1 block bg-[linear-gradient(180deg,#0f172a_0%,#475569_100%)] bg-clip-text text-transparent">
                    refined and ready.
                  </span>
                </h1>

                <p className="mt-3 max-w-2xl text-[14px] font-medium leading-6 tracking-[-0.01em] text-neutral-600 sm:text-[15px]">
                  Review your selected pieces, adjust quantities, and move toward checkout in a
                  premium mobile-first cart experience.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto">
                <div className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/72 px-4 py-2 text-[13px] font-semibold tracking-[-0.01em] text-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                  <SparkleIcon />
                  {itemsCount} item{itemsCount === 1 ? "" : "s"}
                </div>

                <button
                  type="button"
                  onClick={() => loadCart(true)}
                  disabled={refreshing}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/72 px-4 py-2 text-[13px] font-semibold tracking-[-0.01em] text-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,1)] transition duration-200 hover:bg-white active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshIcon />
                  {refreshing ? "Refreshing..." : "Refresh cart"}
                </button>
              </div>
            </div>
          </GlassPanel>
        </section>

        {error ? (
          <div className="mb-4">
            <GlassPanel className="border-rose-200/70 bg-white/[0.7] px-4 py-4">
              <div className="text-[14px] font-semibold tracking-[-0.01em] text-rose-800">
                Couldn’t update cart
              </div>
              <div className="mt-1 text-[13px] leading-6 text-rose-700">{error}</div>
            </GlassPanel>
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6">
            <section className="order-2 space-y-3 sm:order-1 sm:space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </section>

            <aside className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
              <GlassPanel className="p-4 sm:p-5 lg:p-6">
                <div className="h-5 w-32 animate-pulse rounded-full bg-black/7" />
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-4 animate-pulse rounded-full bg-black/7" />
                  ))}
                </div>
                <div className="mt-6 h-12 animate-pulse rounded-2xl bg-black/7" />
              </GlassPanel>
            </aside>
          </div>
        ) : items.length === 0 ? (
          <GlassPanel className="px-5 py-10 text-center sm:px-8 sm:py-14">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] border border-white/70 bg-white/78 text-neutral-900 shadow-[0_8px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,1)]">
              <CartIcon className="h-7 w-7" />
            </div>

            <div className="mt-6 text-[24px] font-semibold tracking-[-0.05em] text-neutral-950 sm:text-[30px]">
              Your cart is empty
            </div>

            <div className="mx-auto mt-3 max-w-md text-[14px] font-medium leading-6 tracking-[-0.01em] text-neutral-600 sm:text-[15px]">
              Start exploring the collection and add something refined to your bag.
            </div>

            <div className="mt-7">
              <Link
                href="/products"
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-[13px] font-semibold tracking-[-0.01em] text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)] transition duration-200 hover:bg-neutral-800 active:scale-[0.985] sm:text-sm"
              >
                Continue shopping
                <ArrowRightIcon />
              </Link>
            </div>
          </GlassPanel>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6">
              <section className="order-2 space-y-3 sm:order-1 sm:space-y-4">
                {items.map((item) => {
                  const quantity = Math.max(1, Number(item.quantity || 1));
                  const rowBusy = busyKey === item.key;
                  const key = String(item.key || "");

                  return (
                    <CartCard
                      key={item.key || `${item.id}-${item.name}`}
                      item={item}
                      busy={rowBusy}
                      onDecrease={() => updateQuantity(key, quantity - 1)}
                      onIncrease={() => updateQuantity(key, quantity + 1)}
                      onRemove={() => removeItem(key)}
                    />
                  );
                })}
              </section>

              <aside className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
                <GlassPanel className="p-4 sm:p-5 lg:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[23px] font-semibold tracking-[-0.045em] text-neutral-950 sm:text-[25px]">
                        Order summary
                      </div>
                      <p className="mt-1 text-[13px] font-medium leading-5 tracking-[-0.01em] text-neutral-600 sm:text-sm">
                        A clean breakdown before checkout.
                      </p>
                    </div>

                    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/70 bg-white/76 text-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                      <ShieldIcon />
                    </div>
                  </div>

                  <div className="mt-6 rounded-[24px] border border-white/70 bg-white/58 p-4">
                    <div className="space-y-3.5">
                      <SummaryRow label="Subtotal" value={subtotalLabel} />
                      <SummaryRow label="Discount" value={discountLabel} />
                      <SummaryRow label="Shipping" value={shippingLabel} />

                      <div className="my-1 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />

                      <SummaryRow label="Estimated total" value={totalLabel} strong />
                    </div>
                  </div>

                  <div className="mt-4 rounded-[24px] border border-white/70 bg-white/62 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-neutral-950 text-white shadow-[0_8px_20px_rgba(15,23,42,0.15)]">
                        <ShieldIcon />
                      </div>
                      <div>
                        <div className="text-[14px] font-semibold tracking-[-0.02em] text-neutral-900">
                          Ready for checkout
                        </div>
                        <div className="mt-1 text-[13px] leading-6 tracking-[-0.01em] text-neutral-600">
                          Review complete pricing and continue when you’re ready.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 hidden grid-cols-1 gap-3 sm:grid lg:grid-cols-1">
                    <Link
                      href="/checkout"
                      className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-[14px] font-semibold tracking-[-0.01em] text-white shadow-[0_14px_34px_rgba(15,23,42,0.18)] transition duration-200 hover:bg-neutral-800 active:scale-[0.985]"
                    >
                      Proceed to checkout
                      <ArrowRightIcon />
                    </Link>

                    <Link
                      href="/products"
                      className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/76 px-5 py-3 text-[13px] font-semibold tracking-[-0.01em] text-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,1)] transition duration-200 hover:bg-white active:scale-[0.985]"
                    >
                      Continue shopping
                      <ArrowRightIcon />
                    </Link>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div className="rounded-[18px] border border-white/70 bg-white/60 px-4 py-3 text-[12px] font-semibold tracking-[-0.01em] text-neutral-700 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                      Touch-friendly controls
                    </div>
                    <div className="rounded-[18px] border border-white/70 bg-white/60 px-4 py-3 text-[12px] font-semibold tracking-[-0.01em] text-neutral-700 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                      Mobile-first layout
                    </div>
                  </div>
                </GlassPanel>
              </aside>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-white/55 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:hidden">
              <div className="mx-auto flex max-w-7xl items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Total
                  </div>
                  <div className="truncate text-[18px] font-semibold tracking-[-0.04em] text-neutral-950">
                    {totalLabel}
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-[13px] font-semibold tracking-[-0.01em] text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition duration-200 active:scale-[0.985]"
                >
                  Checkout
                  <ArrowRightIcon />
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}