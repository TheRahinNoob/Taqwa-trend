"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import {
  formatMinorAmount,
  itemVariantText,
  normalizeAddress,
  stripHtml,
} from "@/lib/checkout";
import type {
  CheckoutGetResponse,
  CheckoutUpdatePayload,
  PlaceOrderPayload,
  WooAddress,
  WooCartItem,
  WooCartResponse,
} from "../types/checkout";

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

function normalizeCheckoutCartItem(item: WooCartItem): WooCartItem {
  return {
    ...item,
    permalink: normalizePublicWpUrl(String((item as any)?.permalink ?? "")),
    images: Array.isArray(item.images)
      ? item.images.map((img: any) => ({
          ...img,
          src: normalizePublicWpUrl(String(img?.src ?? "")),
          thumbnail: normalizePublicWpUrl(String(img?.thumbnail ?? "")),
          alt: String(img?.alt ?? ""),
          name: String(img?.name ?? ""),
        }))
      : [],
  };
}

function normalizeCheckoutCart(cart: WooCartResponse | null): WooCartResponse | null {
  if (!cart || typeof cart !== "object") return cart;

  return {
    ...cart,
    items: Array.isArray(cart.items)
      ? cart.items.map((item) => normalizeCheckoutCartItem(item))
      : [],
  };
}

function BagIcon({ className = "h-5 w-5" }: { className?: string }) {
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

function TruckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 7h11v8H3V7Zm11 3h3l3 3v2h-6v-5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function CashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 9.5h.01M17 14.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 12.5 9.2 17 19 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 sm:mb-5">
      {eyebrow ? (
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          {eyebrow}
        </div>
      ) : null}
      <h2 className="text-[20px] font-semibold tracking-[-0.045em] text-neutral-950 sm:text-[22px]">
        {title}
      </h2>
      {description ? (
        <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-neutral-600 sm:text-[14px]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function FieldShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-white/70 bg-white/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.03)] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <FieldShell>
        <div className="mb-2 text-[12px] font-semibold tracking-[-0.01em] text-neutral-700">
          {label}
          {required ? <span className="ml-1 text-neutral-400">*</span> : null}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-11 w-full bg-transparent px-1 text-[15px] font-medium text-neutral-950 outline-none placeholder:text-neutral-400"
        />
      </FieldShell>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <FieldShell>
        <div className="mb-2 text-[12px] font-semibold tracking-[-0.01em] text-neutral-700">
          {label}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="min-h-[112px] w-full resize-none bg-transparent px-1 text-[15px] font-medium text-neutral-950 outline-none placeholder:text-neutral-400"
        />
      </FieldShell>
    </label>
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

function itemImage(item: WooCartItem): string {
  const img = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null;
  return img?.thumbnail || img?.src || "";
}

function itemAlt(item: WooCartItem): string {
  const img = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null;
  return img?.alt || img?.name || item.name || "Checkout item";
}

function emptyAddress(): WooAddress {
  return normalizeAddress();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validateForm(params: {
  billingAddress: WooAddress;
  shippingAddress: WooAddress;
  shipToDifferentAddress: boolean;
}) {
  const billing = params.billingAddress;
  const shipping = params.shipToDifferentAddress ? params.shippingAddress : params.billingAddress;

  if (!billing.first_name?.trim()) return "First name is required.";
  if (!billing.last_name?.trim()) return "Last name is required.";
  if (!billing.phone?.trim()) return "Phone number is required.";
  if (!billing.email?.trim()) return "Email is required.";
  if (!isValidEmail(String(billing.email ?? ""))) return "Please enter a valid email address.";
  if (!billing.address_1?.trim()) return "Address is required.";
  if (!billing.city?.trim()) return "City is required.";
  if (!billing.country?.trim()) return "Country is required.";

  if (!shipping.first_name?.trim()) return "Shipping first name is required.";
  if (!shipping.last_name?.trim()) return "Shipping last name is required.";
  if (!shipping.phone?.trim()) return "Shipping phone number is required.";
  if (!shipping.address_1?.trim()) return "Shipping address is required.";
  if (!shipping.city?.trim()) return "Shipping city is required.";
  if (!shipping.country?.trim()) return "Shipping country is required.";

  return "";
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<WooCartResponse | null>(null);
  const [billingAddress, setBillingAddress] = useState<WooAddress>(emptyAddress());
  const [shippingAddress, setShippingAddress] = useState<WooAddress>(emptyAddress());
  const [shipToDifferentAddress, setShipToDifferentAddress] = useState(false);
  const [customerNote, setCustomerNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [error, setError] = useState("");
  const [draftMessage, setDraftMessage] = useState("");

  const loadCheckout = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      setError("");
      setDraftMessage("");

      const res = await fetch("/api/checkout", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await res.json().catch(() => null)) as CheckoutGetResponse | null;

      if (!res.ok || !data?.ok) {
        throw new Error((data as any)?.error || "Failed to load checkout");
      }

      const nextCart = normalizeCheckoutCart(data.checkout?.cart ?? null);
      setCart(nextCart);

      const draftOrder = data.checkout?.draftOrder as Record<string, any> | null | undefined;

      const billing =
        normalizeAddress(
          (draftOrder?.billing_address as WooAddress | undefined) ??
            nextCart?.billing_address ??
            undefined
        ) ?? emptyAddress();

      const shipping =
        normalizeAddress(
          (draftOrder?.shipping_address as WooAddress | undefined) ??
            nextCart?.shipping_address ??
            undefined
        ) ?? emptyAddress();

      setBillingAddress(billing);
      setShippingAddress(shipping);
      setCustomerNote(String(draftOrder?.customer_note ?? data.checkout?.customer_note ?? ""));
      setPaymentMethod(
        String(draftOrder?.payment_method ?? data.checkout?.selected_payment_method ?? "cod")
      );

      const addressesDiffer =
        JSON.stringify(normalizeAddress(shipping)) !== JSON.stringify(normalizeAddress(billing));
      setShipToDifferentAddress(addressesDiffer);
    } catch (e: any) {
      setError(e?.message || "Failed to load checkout");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCheckout();
  }, [loadCheckout]);

  const items = useMemo(() => (Array.isArray(cart?.items) ? cart.items : []), [cart]);
  const totals = cart?.totals ?? {};

  const itemsCount = useMemo(() => {
    if (typeof cart?.items_count === "number") return cart.items_count;
    return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [cart?.items_count, items]);

  const subtotalLabel = useMemo(() => formatMinorAmount(totals.total_items, totals), [totals]);
  const shippingLabel = useMemo(() => {
    return totals.total_shipping == null
      ? "Calculated at checkout"
      : formatMinorAmount(totals.total_shipping, totals);
  }, [totals]);
  const discountLabel = useMemo(() => formatMinorAmount(totals.total_discount, totals), [totals]);
  const totalLabel = useMemo(() => formatMinorAmount(totals.total_price, totals), [totals]);

  const handleBillingChange = <K extends keyof WooAddress>(key: K, value: string) => {
    setBillingAddress((prev) => ({ ...prev, [key]: value }));
  };

  const handleShippingChange = <K extends keyof WooAddress>(key: K, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [key]: value }));
  };

  const saveDraft = useCallback(async () => {
    try {
      setSavingDraft(true);
      setError("");
      setDraftMessage("");

      const payload: CheckoutUpdatePayload = {
        billing_address: billingAddress,
        shipping_address: shipToDifferentAddress ? shippingAddress : billingAddress,
        customer_note: customerNote,
        payment_method: paymentMethod,
        ship_to_different_address: shipToDifferentAddress,
      };

      const res = await fetch("/api/checkout", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to update checkout");
      }

      setCart(normalizeCheckoutCart(data.checkout?.cart ?? null));
      setDraftMessage("Checkout details saved.");
    } catch (e: any) {
      setError(e?.message || "Failed to update checkout");
    } finally {
      setSavingDraft(false);
    }
  }, [billingAddress, shippingAddress, customerNote, paymentMethod, shipToDifferentAddress]);

  const placeOrderNow = async () => {
    try {
      const validationError = validateForm({
        billingAddress,
        shippingAddress,
        shipToDifferentAddress,
      });

      if (validationError) {
        setError(validationError);
        return;
      }

      setPlacingOrder(true);
      setError("");
      setDraftMessage("");

      const payload: PlaceOrderPayload = {
        billing_address: billingAddress,
        shipping_address: shipToDifferentAddress ? shippingAddress : billingAddress,
        customer_note: customerNote,
        payment_method: paymentMethod || "cod",
        payment_data: [],
      };

      const res = await fetch("/api/checkout/place-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to place order");
      }

      const redirectUrl =
        typeof data?.redirectUrl === "string" && data.redirectUrl.trim()
          ? data.redirectUrl
          : "/checkout/success";

      window.location.href = redirectUrl;
    } catch (e: any) {
      setError(e?.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  const renderCartItem = (item: WooCartItem) => {
    const image = itemImage(item);
    const variantText = itemVariantText(item);
    const quantity = Math.max(1, Number(item.quantity || 1));
    const lineTotal = formatMinorAmount(
      item?.totals?.line_total ?? item?.prices?.price ?? 0,
      item?.totals ?? item?.prices
    );
    const description = stripHtml(item.short_description || item.description || "");

    return (
      <div
        key={item.key || `${item.id}-${item.name}`}
        className="flex items-start gap-3 rounded-[22px] border border-white/70 bg-white/72 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]"
      >
        <div className="h-[84px] w-[68px] shrink-0 overflow-hidden rounded-[18px] border border-black/5 bg-neutral-100">
          {image ? (
            <img
              src={image}
              alt={itemAlt(item)}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.08),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.05),transparent_40%)]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="line-clamp-2 text-[14px] font-semibold leading-[1.25] tracking-[-0.02em] text-neutral-950">
                {item.name || "Item"}
              </div>

              {variantText ? (
                <div className="mt-1 line-clamp-2 text-[12px] font-medium leading-5 text-neutral-600">
                  {variantText}
                </div>
              ) : description ? (
                <div className="mt-1 line-clamp-2 text-[12px] font-medium leading-5 text-neutral-600">
                  {description}
                </div>
              ) : null}
            </div>

            <div className="shrink-0 text-[12px] font-semibold tracking-[-0.01em] text-neutral-900">
              {lineTotal}
            </div>
          </div>

          <div className="mt-2 inline-flex rounded-full border border-black/5 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
            Qty {quantity}
          </div>
        </div>
      </div>
    );
  };

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
                  <BagIcon className="h-4 w-4" />
                  Secure checkout
                </div>

                <h1 className="mt-3 max-w-3xl text-[clamp(28px,9vw,58px)] font-semibold leading-[0.94] tracking-[-0.07em] text-neutral-950">
                  Complete your order
                  <span className="mt-1 block bg-[linear-gradient(180deg,#0f172a_0%,#475569_100%)] bg-clip-text text-transparent">
                    with clarity and ease.
                  </span>
                </h1>

                <p className="mt-3 max-w-2xl text-[14px] font-medium leading-6 tracking-[-0.01em] text-neutral-600 sm:text-[15px]">
                  Review your items, add delivery details, and place your Cash on Delivery order in
                  a smooth mobile-first experience.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto">
                <div className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/72 px-4 py-2 text-[13px] font-semibold tracking-[-0.01em] text-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                  <ShieldIcon />
                  Protected checkout
                </div>

                <button
                  type="button"
                  onClick={() => loadCheckout(true)}
                  disabled={refreshing}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/72 px-4 py-2 text-[13px] font-semibold tracking-[-0.01em] text-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,1)] transition duration-200 hover:bg-white active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshIcon />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
          </GlassPanel>
        </section>

        {error ? (
          <div className="mb-4">
            <GlassPanel className="border-rose-200/70 bg-white/[0.7] px-4 py-4">
              <div className="text-[14px] font-semibold tracking-[-0.01em] text-rose-800">
                Checkout issue
              </div>
              <div className="mt-1 text-[13px] leading-6 text-rose-700">{error}</div>
            </GlassPanel>
          </div>
        ) : null}

        {draftMessage ? (
          <div className="mb-4">
            <GlassPanel className="border-emerald-200/70 bg-white/[0.7] px-4 py-4">
              <div className="text-[14px] font-semibold tracking-[-0.01em] text-emerald-800">
                Saved
              </div>
              <div className="mt-1 text-[13px] leading-6 text-emerald-700">{draftMessage}</div>
            </GlassPanel>
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <GlassPanel key={i} className="p-4 sm:p-5">
                  <div className="h-5 w-36 animate-pulse rounded-full bg-black/7" />
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <div key={j} className="h-[74px] animate-pulse rounded-[22px] bg-black/7" />
                    ))}
                  </div>
                </GlassPanel>
              ))}
            </div>

            <GlassPanel className="p-4 sm:p-5 lg:sticky lg:top-24 lg:self-start">
              <div className="h-6 w-32 animate-pulse rounded-full bg-black/7" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-[22px] bg-black/7" />
                ))}
              </div>
              <div className="mt-5 h-12 animate-pulse rounded-2xl bg-black/7" />
            </GlassPanel>
          </div>
        ) : items.length === 0 ? (
          <GlassPanel className="px-5 py-12 text-center sm:px-8 sm:py-14">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] border border-white/70 bg-white/78 text-neutral-900 shadow-[0_8px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,1)]">
              <BagIcon className="h-7 w-7" />
            </div>

            <div className="mt-6 text-[24px] font-semibold tracking-[-0.05em] text-neutral-950 sm:text-[30px]">
              Your cart is empty
            </div>

            <div className="mx-auto mt-3 max-w-md text-[14px] font-medium leading-6 tracking-[-0.01em] text-neutral-600 sm:text-[15px]">
              Add a few products to your bag before moving to checkout.
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
              <section className="order-2 space-y-4 lg:order-1">
                <GlassPanel className="p-4 sm:p-5 lg:p-6">
                  <SectionTitle
                    eyebrow="Step 1"
                    title="Contact details"
                    description="Use details that help the courier reach you quickly."
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="First name"
                      value={billingAddress.first_name ?? ""}
                      onChange={(v) => handleBillingChange("first_name", v)}
                      autoComplete="given-name"
                      required
                    />
                    <Input
                      label="Last name"
                      value={billingAddress.last_name ?? ""}
                      onChange={(v) => handleBillingChange("last_name", v)}
                      autoComplete="family-name"
                      required
                    />
                    <Input
                      label="Phone"
                      value={billingAddress.phone ?? ""}
                      onChange={(v) => handleBillingChange("phone", v)}
                      autoComplete="tel"
                      required
                    />
                    <Input
                      label="Email"
                      value={billingAddress.email ?? ""}
                      onChange={(v) => handleBillingChange("email", v)}
                      type="email"
                      autoComplete="email"
                      required
                    />
                  </div>
                </GlassPanel>

                <GlassPanel className="p-4 sm:p-5 lg:p-6">
                  <SectionTitle
                    eyebrow="Step 2"
                    title="Billing address"
                    description="This is your main address for order and contact details."
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Input
                        label="Address line 1"
                        value={billingAddress.address_1 ?? ""}
                        onChange={(v) => handleBillingChange("address_1", v)}
                        autoComplete="address-line1"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Input
                        label="Address line 2"
                        value={billingAddress.address_2 ?? ""}
                        onChange={(v) => handleBillingChange("address_2", v)}
                        autoComplete="address-line2"
                      />
                    </div>

                    <Input
                      label="City / Area"
                      value={billingAddress.city ?? ""}
                      onChange={(v) => handleBillingChange("city", v)}
                      autoComplete="address-level2"
                      required
                    />

                    <Input
                      label="State / District"
                      value={billingAddress.state ?? ""}
                      onChange={(v) => handleBillingChange("state", v)}
                      autoComplete="address-level1"
                    />

                    <Input
                      label="Postcode"
                      value={billingAddress.postcode ?? ""}
                      onChange={(v) => handleBillingChange("postcode", v)}
                      autoComplete="postal-code"
                    />

                    <Input
                      label="Country"
                      value={billingAddress.country ?? "BD"}
                      onChange={(v) => handleBillingChange("country", v)}
                      autoComplete="country-name"
                      required
                    />
                  </div>

                  <div className="mt-5">
                    <label className="flex cursor-pointer items-start gap-3 rounded-[22px] border border-white/70 bg-white/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
                      <input
                        type="checkbox"
                        checked={shipToDifferentAddress}
                        onChange={(e) => setShipToDifferentAddress(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-neutral-300"
                      />
                      <div>
                        <div className="text-[14px] font-semibold tracking-[-0.02em] text-neutral-900">
                          Ship to a different address
                        </div>
                        <div className="mt-1 text-[12px] leading-5 text-neutral-600">
                          Turn this on if the parcel should go somewhere else.
                        </div>
                      </div>
                    </label>
                  </div>
                </GlassPanel>

                {shipToDifferentAddress ? (
                  <GlassPanel className="p-4 sm:p-5 lg:p-6">
                    <SectionTitle
                      eyebrow="Step 3"
                      title="Shipping address"
                      description="Use the delivery address where the parcel should arrive."
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="First name"
                        value={shippingAddress.first_name ?? ""}
                        onChange={(v) => handleShippingChange("first_name", v)}
                        required
                      />
                      <Input
                        label="Last name"
                        value={shippingAddress.last_name ?? ""}
                        onChange={(v) => handleShippingChange("last_name", v)}
                        required
                      />
                      <Input
                        label="Phone"
                        value={shippingAddress.phone ?? ""}
                        onChange={(v) => handleShippingChange("phone", v)}
                        required
                      />
                      <Input
                        label="Email"
                        value={shippingAddress.email ?? ""}
                        onChange={(v) => handleShippingChange("email", v)}
                        type="email"
                      />

                      <div className="sm:col-span-2">
                        <Input
                          label="Address line 1"
                          value={shippingAddress.address_1 ?? ""}
                          onChange={(v) => handleShippingChange("address_1", v)}
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Input
                          label="Address line 2"
                          value={shippingAddress.address_2 ?? ""}
                          onChange={(v) => handleShippingChange("address_2", v)}
                        />
                      </div>

                      <Input
                        label="City / Area"
                        value={shippingAddress.city ?? ""}
                        onChange={(v) => handleShippingChange("city", v)}
                        required
                      />

                      <Input
                        label="State / District"
                        value={shippingAddress.state ?? ""}
                        onChange={(v) => handleShippingChange("state", v)}
                      />

                      <Input
                        label="Postcode"
                        value={shippingAddress.postcode ?? ""}
                        onChange={(v) => handleShippingChange("postcode", v)}
                      />

                      <Input
                        label="Country"
                        value={shippingAddress.country ?? "BD"}
                        onChange={(v) => handleShippingChange("country", v)}
                        required
                      />
                    </div>
                  </GlassPanel>
                ) : null}

                <GlassPanel className="p-4 sm:p-5 lg:p-6">
                  <SectionTitle
                    eyebrow={shipToDifferentAddress ? "Step 4" : "Step 3"}
                    title="Delivery note"
                    description="Optional instructions to make delivery easier."
                  />

                  <TextArea
                    label="Order note"
                    value={customerNote}
                    onChange={setCustomerNote}
                    placeholder="Apartment number, landmark, preferred call instructions, or any special note."
                  />
                </GlassPanel>

                <GlassPanel className="p-4 sm:p-5 lg:p-6">
                  <SectionTitle
                    eyebrow={shipToDifferentAddress ? "Step 5" : "Step 4"}
                    title="Payment method"
                    description="Your checkout currently supports Cash on Delivery."
                  />

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-[24px] border p-4 text-left transition duration-200",
                      paymentMethod === "cod"
                        ? "border-neutral-900 bg-neutral-950 text-white shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
                        : "border-white/70 bg-white/72 text-neutral-950"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                        paymentMethod === "cod"
                          ? "bg-white/12 text-white"
                          : "bg-neutral-950 text-white"
                      )}
                    >
                      <CashIcon />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[15px] font-semibold tracking-[-0.02em]">
                          Cash on Delivery
                        </div>
                        {paymentMethod === "cod" ? (
                          <div className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold">
                            <CheckIcon className="h-3.5 w-3.5" />
                            Selected
                          </div>
                        ) : null}
                      </div>

                      <div
                        className={cn(
                          "mt-1 text-[13px] leading-6",
                          paymentMethod === "cod" ? "text-white/80" : "text-neutral-600"
                        )}
                      >
                        Place your order now and pay in cash when your parcel arrives.
                      </div>
                    </div>
                  </button>
                </GlassPanel>

                <div className="hidden gap-3 sm:flex">
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={savingDraft || placingOrder}
                    className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/72 px-5 py-3 text-[13px] font-semibold tracking-[-0.01em] text-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,1)] transition duration-200 hover:bg-white active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshIcon />
                    {savingDraft ? "Saving..." : "Save checkout details"}
                  </button>

                  <Link
                    href="/cart"
                    className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/60 px-5 py-3 text-[13px] font-semibold tracking-[-0.01em] text-neutral-800 transition duration-200 hover:bg-white active:scale-[0.985]"
                  >
                    Back to cart
                  </Link>
                </div>
              </section>

              <aside className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
                <GlassPanel className="p-4 sm:p-5 lg:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[23px] font-semibold tracking-[-0.045em] text-neutral-950 sm:text-[25px]">
                        Order summary
                      </div>
                      <p className="mt-1 text-[13px] font-medium leading-5 tracking-[-0.01em] text-neutral-600 sm:text-sm">
                        {itemsCount} item{itemsCount === 1 ? "" : "s"} ready for order.
                      </p>
                    </div>

                    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/70 bg-white/76 text-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                      <TruckIcon />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {items.map(renderCartItem)}
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
                          Cash on Delivery enabled
                        </div>
                        <div className="mt-1 text-[13px] leading-6 tracking-[-0.01em] text-neutral-600">
                          Your order will be placed now, and payment will be collected upon
                          delivery.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 hidden grid-cols-1 gap-3 sm:grid lg:grid-cols-1">
                    <button
                      type="button"
                      onClick={placeOrderNow}
                      disabled={placingOrder || savingDraft || items.length === 0}
                      className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-[14px] font-semibold tracking-[-0.01em] text-white shadow-[0_14px_34px_rgba(15,23,42,0.18)] transition duration-200 hover:bg-neutral-800 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {placingOrder ? "Placing order..." : "Place order"}
                      <ArrowRightIcon />
                    </button>

                    <button
                      type="button"
                      onClick={saveDraft}
                      disabled={savingDraft || placingOrder}
                      className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/76 px-5 py-3 text-[13px] font-semibold tracking-[-0.01em] text-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,1)] transition duration-200 hover:bg-white active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingDraft ? "Saving..." : "Save details"}
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div className="rounded-[18px] border border-white/70 bg-white/60 px-4 py-3 text-[12px] font-semibold tracking-[-0.01em] text-neutral-700 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                      Mobile-first flow
                    </div>
                    <div className="rounded-[18px] border border-white/70 bg-white/60 px-4 py-3 text-[12px] font-semibold tracking-[-0.01em] text-neutral-700 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                      Smooth COD experience
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

                <button
                  type="button"
                  onClick={placeOrderNow}
                  disabled={placingOrder || savingDraft || items.length === 0}
                  className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-[13px] font-semibold tracking-[-0.01em] text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition duration-200 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {placingOrder ? "Placing..." : "Place order"}
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}