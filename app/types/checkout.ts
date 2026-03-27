export type MoneyMeta = {
  currency_code?: string;
  currency_symbol?: string;
  currency_minor_unit?: number;
  currency_decimal_separator?: string;
  currency_thousand_separator?: string;
  currency_prefix?: string;
  currency_suffix?: string;
};

export type WooAddress = {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
};

export type WooCartImage = {
  id?: number;
  src?: string;
  thumbnail?: string;
  srcset?: string;
  sizes?: string;
  name?: string;
  alt?: string;
};

export type WooCartItem = {
  key?: string;
  id?: number;
  quantity?: number;
  name?: string;
  short_description?: string;
  description?: string;
  sku?: string;
  permalink?: string;
  images?: WooCartImage[];
  variation?: Array<{ attribute?: string; value?: string }>;
  item_data?: Array<{ key?: string; value?: string }>;
  prices?: {
    price?: string | number | null;
    regular_price?: string | number | null;
    sale_price?: string | number | null;
  } & MoneyMeta;
  totals?: {
    line_total?: string | number | null;
    line_total_tax?: string | number | null;
  } & MoneyMeta;
};

export type WooCartTotals = {
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
} & MoneyMeta;

export type WooShippingRate = {
  rate_id?: string;
  name?: string;
  description?: string;
  delivery_time?: string;
  price?: string;
  taxes?: string;
  selected?: boolean;
};

export type WooShippingPackage = {
  package_id?: number | string;
  name?: string;
  destination?: WooAddress;
  shipping_rates?: WooShippingRate[];
};

export type WooCartResponse = {
  items?: WooCartItem[];
  items_count?: number;
  items_weight?: number;
  needs_payment?: boolean;
  needs_shipping?: boolean;
  has_calculated_shipping?: boolean;
  shipping_rates?: WooShippingPackage[] | WooShippingRate[];
  totals?: WooCartTotals;
  billing_address?: WooAddress;
  shipping_address?: WooAddress;
  payment_methods?: string[];
  errors?: Array<{ code?: string; message?: string }>;
  extensions?: Record<string, unknown>;
};

export type CheckoutFormData = {
  billing_address: WooAddress;
  shipping_address: WooAddress;
  customer_note?: string;
  payment_method: string;
  payment_data?: Array<{
    key: string;
    value: string;
  }>;
  ship_to_different_address?: boolean;
};

export type CheckoutApiState = {
  cart: WooCartResponse | null;
  draftOrder?: Record<string, unknown> | null;
  selected_payment_method: string;
  customer_note: string;
};

export type CheckoutGetResponse = {
  ok: true;
  cartToken: string | null;
  checkout: CheckoutApiState;
};

export type CheckoutUpdatePayload = {
  billing_address?: WooAddress;
  shipping_address?: WooAddress;
  customer_note?: string;
  payment_method?: string;
  ship_to_different_address?: boolean;
  selected_shipping_rate?: string;
};

export type CheckoutUpdateResponse = {
  ok: true;
  cartToken: string | null;
  checkout: CheckoutApiState;
};

export type PlaceOrderPayload = {
  billing_address: WooAddress;
  shipping_address: WooAddress;
  customer_note?: string;
  payment_method: "cod" | string;
  payment_data?: Array<{
    key: string;
    value: string;
  }>;
};

export type PlaceOrderResponse = {
  ok: boolean;
  orderId?: number | string;
  orderKey?: string;
  status?: string;
  redirectUrl?: string;
  message?: string;
  raw?: unknown;
};

export type NormalizedCheckoutItem = {
  key: string;
  id: number | null;
  name: string;
  quantity: number;
  image: string;
  alt: string;
  unitPrice: string;
  lineTotal: string;
  variantText: string;
};

export type NormalizedCheckoutSummary = {
  items: NormalizedCheckoutItem[];
  itemsCount: number;
  subtotal: string;
  shipping: string;
  discount: string;
  total: string;
  paymentMethods: string[];
  needsShipping: boolean;
  needsPayment: boolean;
};