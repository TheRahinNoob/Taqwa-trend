import type {
  CheckoutApiState,
  CheckoutFormData,
  CheckoutUpdatePayload,
  NormalizedCheckoutItem,
  NormalizedCheckoutSummary,
  WooAddress,
  WooCartItem,
  WooCartResponse,
  WooCartTotals,
} from "../app/types/checkout";

function toMinorNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function formatMinorAmount(
  value: unknown,
  meta?: {
    currency_symbol?: string;
    currency_minor_unit?: number;
    currency_prefix?: string;
    currency_suffix?: string;
  }
): string {
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

export function stripHtml(html: unknown): string {
  return String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function itemImage(item: WooCartItem): string {
  const img = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null;
  return img?.thumbnail || img?.src || "";
}

export function itemAlt(item: WooCartItem): string {
  const img = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null;
  return img?.alt || img?.name || item.name || "Checkout item";
}

export function itemVariantText(item: WooCartItem): string {
  const fromVariation = Array.isArray(item.variation)
    ? item.variation
        .map((x: { attribute?: string; value?: string }) => {
          const attr = String(x?.attribute ?? "").trim();
          const value = String(x?.value ?? "").trim();
          return attr && value ? `${attr}: ${value}` : "";
        })
        .filter(Boolean)
    : [];

  const fromItemData = Array.isArray(item.item_data)
    ? item.item_data
        .map((x: { key?: string; value?: string }) => {
          const key = String(x?.key ?? "").trim();
          const value = stripHtml(x?.value ?? "");
          return key && value ? `${key}: ${value}` : "";
        })
        .filter(Boolean)
    : [];

  return [...fromVariation, ...fromItemData].join(" • ");
}

export function normalizeCheckoutItems(items: WooCartItem[] = []): NormalizedCheckoutItem[] {
  return items.map((item: WooCartItem) => ({
    key: String(item.key ?? ""),
    id: typeof item.id === "number" ? item.id : null,
    name: item.name || "Cart item",
    quantity: Math.max(1, Number(item.quantity || 1)),
    image: itemImage(item),
    alt: itemAlt(item),
    unitPrice: formatMinorAmount(item?.prices?.price ?? 0, item?.prices),
    lineTotal: formatMinorAmount(
      item?.totals?.line_total ?? item?.prices?.price ?? 0,
      item?.totals ?? item?.prices
    ),
    variantText: itemVariantText(item),
  }));
}

export function normalizeCheckoutSummary(cart: WooCartResponse | null): NormalizedCheckoutSummary {
  const items: WooCartItem[] = Array.isArray(cart?.items) ? cart.items : [];
  const totals: WooCartTotals = cart?.totals ?? {};

  const itemsCount =
    typeof cart?.items_count === "number"
      ? cart.items_count
      : items.reduce((sum: number, item: WooCartItem) => sum + Number(item.quantity || 0), 0);

  return {
    items: normalizeCheckoutItems(items),
    itemsCount,
    subtotal: formatMinorAmount(totals.total_items, totals),
    shipping:
      totals.total_shipping == null
        ? "Calculated at checkout"
        : formatMinorAmount(totals.total_shipping, totals),
    discount: formatMinorAmount(totals.total_discount, totals),
    total: formatMinorAmount(totals.total_price, totals),
    paymentMethods: Array.isArray(cart?.payment_methods) ? cart.payment_methods : [],
    needsShipping: Boolean(cart?.needs_shipping),
    needsPayment: Boolean(cart?.needs_payment),
  };
}

export function emptyAddress(): WooAddress {
  return {
    first_name: "",
    last_name: "",
    company: "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    postcode: "",
    country: "BD",
    email: "",
    phone: "",
  };
}

export function normalizeAddress(input?: WooAddress | null): WooAddress {
  const base = emptyAddress();

  return {
    ...base,
    ...(input ?? {}),
  };
}

export function buildCheckoutState(params: {
  cart: WooCartResponse | null;
  draftOrder?: Record<string, unknown> | null;
  customerNote?: string;
  paymentMethod?: string;
}): CheckoutApiState {
  return {
    cart: params.cart,
    draftOrder: params.draftOrder ?? null,
    selected_payment_method: params.paymentMethod || "cod",
    customer_note: params.customerNote || "",
  };
}

export function buildCheckoutUpdateBody(payload: CheckoutUpdatePayload) {
  return {
    billing_address: normalizeAddress(payload.billing_address),
    shipping_address: normalizeAddress(payload.shipping_address),
    customer_note: payload.customer_note ?? "",
    payment_method: payload.payment_method ?? "cod",
    __experimental_ship_to_different_address: Boolean(payload.ship_to_different_address),
    selected_shipping_rate: payload.selected_shipping_rate ?? undefined,
  };
}

export function buildPlaceOrderBody(payload: CheckoutFormData) {
  return {
    billing_address: normalizeAddress(payload.billing_address),
    shipping_address: normalizeAddress(payload.shipping_address),
    customer_note: payload.customer_note ?? "",
    payment_method: payload.payment_method || "cod",
    payment_data: Array.isArray(payload.payment_data) ? payload.payment_data : [],
  };
}