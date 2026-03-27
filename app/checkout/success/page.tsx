"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";

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

function normalizeOrder(order: SuccessOrder | null): SuccessOrder | null {
  if (!order || typeof order !== "object") return order;

  return {
    ...order,
    line_items: Array.isArray(order.line_items)
      ? order.line_items.map((item) => ({
          ...item,
          image: normalizePublicWpUrl(String(item?.image ?? "")),
        }))
      : [],
  };
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="m5 12 4.2 4.2L19 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
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

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
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

function CashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M7 9.5h.01M17 14.5h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
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
        "relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_12px_32px_rgba(15,23,42,0.06),0_2px_10px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-2xl",
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))]" />
      <div className="relative">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-[13px] font-medium text-neutral-600 sm:text-sm">{label}</div>
      <div className="text-right text-[13px] font-semibold text-neutral-950 sm:text-sm">
        {value}
      </div>
    </div>
  );
}

type SuccessOrder = {
  id?: number | string | null;
  number?: string | number | null;
  status?: string | null;
  order_key?: string | null;
  currency?: string | null;
  payment_method?: string | null;
  payment_method_title?: string | null;
  date_created?: string | null;
  total?: string | null;
  shipping_total?: string | null;
  discount_total?: string | null;
  subtotal?: number | string | null;
  billing?: Record<string, any> | null;
  shipping?: Record<string, any> | null;
  customer_note?: string;
  line_items?: Array<{
    id?: number | null;
    product_id?: number | null;
    variation_id?: number | null;
    name?: string;
    quantity?: number;
    total?: string;
    subtotal?: string;
    sku?: string;
    image?: string;
  }>;
};

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const orderKey = searchParams.get("key") || "";
  const billingEmail =
    searchParams.get("billing_email") ||
    searchParams.get("billingEmail") ||
    searchParams.get("email") ||
    "";

  const [order, setOrder] = useState<SuccessOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        setError("");

        if (!orderId) {
          setError("Missing order ID.");
          setLoading(false);
          return;
        }

        const params = new URLSearchParams();

        if (orderKey) {
          params.set("key", orderKey);
        }

        if (billingEmail) {
          params.set("billing_email", billingEmail);
        }

        const query = params.toString();
        const url = `/api/orders/${encodeURIComponent(orderId)}${query ? `?${query}` : ""}`;

        const res = await fetch(url, {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Failed to load order details");
        }

        setOrder(normalizeOrder(data.order ?? null));
      } catch (e: any) {
        setError(e?.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId, orderKey, billingEmail]);

  const itemCount = useMemo(() => {
    return Array.isArray(order?.line_items)
      ? order.line_items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0)
      : 0;
  }, [order]);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f4f5f7] text-neutral-950 antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#fbfbfc_0%,#f4f5f7_45%,#eef1f4_100%)]" />
        <div className="absolute left-[-8%] top-[-8%] h-[30rem] w-[30rem] rounded-full bg-white/80 blur-3xl" />
        <div className="absolute right-[-10%] top-[4%] h-[26rem] w-[26rem] rounded-full bg-white/70 blur-3xl" />
      </div>

      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-3 pb-24 pt-4 sm:px-5 sm:pt-8 lg:px-8">
        <GlassPanel className="px-5 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-neutral-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
              <CheckIcon />
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-black/6 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
              Order placed
            </div>

            <h1 className="mt-4 text-[clamp(30px,8vw,54px)] font-semibold leading-[0.94] tracking-[-0.06em] text-neutral-950">
              Thank you,
              <span className="block bg-[linear-gradient(180deg,#111827_0%,#374151_100%)] bg-clip-text text-transparent">
                your order is confirmed.
              </span>
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-[14px] font-medium leading-6 text-neutral-600 sm:text-[15px]">
              We’ve received your order. Since you selected Cash on Delivery, payment
              will be collected when your parcel arrives.
            </p>
          </div>
        </GlassPanel>

        {loading ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <GlassPanel className="p-6">
              <div className="h-6 w-48 animate-pulse rounded-full bg-black/8" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-[20px] bg-black/8" />
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <div className="h-6 w-32 animate-pulse rounded-full bg-black/8" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 animate-pulse rounded-full bg-black/8" />
                ))}
              </div>
            </GlassPanel>
          </div>
        ) : error ? (
          <div className="mt-5">
            <GlassPanel className="p-6">
              <div className="text-[16px] font-semibold text-rose-700">
                Couldn’t load order details
              </div>
              <div className="mt-2 text-[14px] text-rose-600">{error}</div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  Continue shopping
                </Link>
                <Link
                  href="/cart"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-black/8 bg-white px-5 py-3 text-sm font-semibold text-neutral-900"
                >
                  View cart
                </Link>
              </div>
            </GlassPanel>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="space-y-4">
              <GlassPanel className="p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-neutral-950 text-white">
                    <BagIcon />
                  </div>
                  <div>
                    <div className="text-[22px] font-semibold tracking-[-0.04em] text-neutral-950">
                      Order details
                    </div>
                    <p className="mt-1 text-[13px] font-medium text-neutral-600">
                      Keep this information for reference and delivery communication.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <InfoRow label="Order number" value={String(order?.number ?? order?.id ?? "-")} />
                  <InfoRow label="Order status" value={String(order?.status ?? "-")} />
                  <InfoRow
                    label="Payment method"
                    value={String(order?.payment_method_title ?? "Cash on Delivery")}
                  />
                  <InfoRow label="Items" value={`${itemCount}`} />
                  <InfoRow label="Order total" value={`${order?.currency ?? ""} ${order?.total ?? "-"}`} />
                </div>
              </GlassPanel>

              <GlassPanel className="p-6">
                <div className="text-[22px] font-semibold tracking-[-0.04em] text-neutral-950">
                  Ordered items
                </div>

                <div className="mt-5 space-y-3">
                  {Array.isArray(order?.line_items) && order.line_items.length > 0 ? (
                    order.line_items.map((item) => (
                      <div
                        key={item.id ?? `${item.product_id}-${item.name}`}
                        className="flex gap-3 rounded-[22px] border border-black/6 bg-white/65 p-3"
                      >
                        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-[16px] border border-black/5 bg-neutral-100">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name || "Order item"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.08),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.05),transparent_40%)]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="line-clamp-2 text-[14px] font-semibold tracking-[-0.02em] text-neutral-950">
                                {item.name || "Item"}
                              </div>
                              {item.sku ? (
                                <div className="mt-1 text-[12px] font-medium text-neutral-500">
                                  SKU: {item.sku}
                                </div>
                              ) : null}
                            </div>

                            <div className="shrink-0 text-[12px] font-semibold text-neutral-900">
                              {order?.currency ?? ""} {item.total ?? "0"}
                            </div>
                          </div>

                          <div className="mt-2 text-[12px] font-semibold text-neutral-500">
                            Qty {Number(item.quantity || 1)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[14px] text-neutral-600">No line items found.</div>
                  )}
                </div>
              </GlassPanel>

              {order?.customer_note ? (
                <GlassPanel className="p-6">
                  <div className="text-[22px] font-semibold tracking-[-0.04em] text-neutral-950">
                    Your note
                  </div>
                  <div className="mt-3 text-[14px] leading-7 text-neutral-700">
                    {order.customer_note}
                  </div>
                </GlassPanel>
              ) : null}
            </section>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <GlassPanel className="p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-neutral-950 text-white">
                    <TruckIcon />
                  </div>
                  <div>
                    <div className="text-[20px] font-semibold tracking-[-0.04em] text-neutral-950">
                      Delivery info
                    </div>
                    <p className="mt-1 text-[13px] font-medium text-neutral-600">
                      We’ll deliver to the address below.
                    </p>
                  </div>
                </div>

                <div className="mt-5 text-[14px] leading-7 text-neutral-700">
                  <div className="font-semibold text-neutral-900">
                    {order?.shipping?.first_name || order?.billing?.first_name || ""}{" "}
                    {order?.shipping?.last_name || order?.billing?.last_name || ""}
                  </div>
                  <div>{order?.shipping?.address_1 || order?.billing?.address_1 || ""}</div>
                  {order?.shipping?.address_2 || order?.billing?.address_2 ? (
                    <div>{order?.shipping?.address_2 || order?.billing?.address_2 || ""}</div>
                  ) : null}
                  <div>
                    {order?.shipping?.city || order?.billing?.city || ""}{" "}
                    {order?.shipping?.state || order?.billing?.state || ""}
                  </div>
                  <div>{order?.shipping?.country || order?.billing?.country || ""}</div>
                  <div className="mt-2 font-medium text-neutral-800">
                    {order?.shipping?.phone || order?.billing?.phone || ""}
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel className="p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-neutral-950 text-white">
                    <CashIcon />
                  </div>
                  <div>
                    <div className="text-[20px] font-semibold tracking-[-0.04em] text-neutral-950">
                      Cash on Delivery
                    </div>
                    <p className="mt-1 text-[13px] font-medium text-neutral-600">
                      Payment will be collected when your parcel arrives.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <InfoRow label="Subtotal" value={`${order?.currency ?? ""} ${order?.subtotal ?? "-"}`} />
                  <InfoRow label="Shipping" value={`${order?.currency ?? ""} ${order?.shipping_total ?? "-"}`} />
                  <InfoRow label="Discount" value={`${order?.currency ?? ""} ${order?.discount_total ?? "-"}`} />
                  <div className="my-3 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
                  <InfoRow label="Total" value={`${order?.currency ?? ""} ${order?.total ?? "-"}`} />
                </div>
              </GlassPanel>

              <GlassPanel className="p-6">
                <div className="text-[18px] font-semibold tracking-[-0.03em] text-neutral-950">
                  What next?
                </div>
                <div className="mt-3 text-[14px] leading-7 text-neutral-700">
                  Keep your phone available. Your courier or team may contact you before
                  delivery.
                </div>

                <div className="mt-5 grid gap-3">
                  <Link
                    href="/products"
                    className="inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Continue shopping
                  </Link>
                  <Link
                    href="/cart"
                    className="inline-flex min-h-[50px] items-center justify-center rounded-2xl border border-black/8 bg-white px-5 py-3 text-sm font-semibold text-neutral-900"
                  >
                    Go to cart
                  </Link>
                </div>
              </GlassPanel>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}