import {
  applyCartToken,
  getCartTokenFromResponseHeaders,
} from "@/lib/cart-token";

type StoreRequestInit = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  cartToken?: string | null;
  body?: unknown;
  searchParams?: Record<string, string | number | boolean | undefined | null>;
};

export type StoreApiSuccess<T = unknown> = {
  ok: true;
  status: number;
  data: T;
  cartToken: string | null;
  headers: Headers;
};

export type StoreApiFailure = {
  ok: false;
  status: number;
  error: string;
  details: unknown;
  cartToken: string | null;
  headers: Headers;
};

export type StoreApiResult<T = unknown> = StoreApiSuccess<T> | StoreApiFailure;

function normalizeBaseUrl(input: string) {
  let base = String(input || "").trim();

  if (!base) return "";

  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  }

  return base.replace(/\/+$/, "");
}

function getBaseUrl() {
  const baseUrl =
    process.env.WOOCOMMERCE_STORE_API_BASE_URL ||
    process.env.NEXT_PUBLIC_WORDPRESS_URL ||
    process.env.WORDPRESS_API_URL;

  if (!baseUrl) {
    throw new Error(
      "Missing WooCommerce base URL. Set WOOCOMMERCE_STORE_API_BASE_URL or NEXT_PUBLIC_WORDPRESS_URL."
    );
  }

  return normalizeBaseUrl(baseUrl);
}

function getStoreApiBase() {
  const baseUrl = getBaseUrl();

  if (baseUrl.includes("/wp-json/wc/store/v1")) {
    return baseUrl;
  }

  return `${baseUrl}/wp-json/wc/store/v1`;
}

function buildStoreApiUrl(
  path: string,
  searchParams?: Record<string, string | number | boolean | undefined | null>
) {
  const storeApiBase = getStoreApiBase();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${storeApiBase}${normalizedPath}`);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function safeParseJson(response: Response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function wcStoreFetch<T = unknown>({
  method = "GET",
  path,
  cartToken,
  body,
  searchParams,
}: StoreRequestInit): Promise<StoreApiResult<T>> {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  applyCartToken(headers, cartToken);

  const url = buildStoreApiUrl(path, searchParams);

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const data = await safeParseJson(response);
  const nextCartToken =
    getCartTokenFromResponseHeaders(response.headers) ?? cartToken ?? null;

  if (!response.ok) {
    const message =
      (data as any)?.message ||
      (data as any)?.error ||
      (data as any)?.details?.message ||
      `WooCommerce Store API request failed with status ${response.status}`;

    return {
      ok: false,
      status: response.status,
      error: message,
      details: {
        url,
        response: data,
      },
      cartToken: nextCartToken,
      headers: response.headers,
    };
  }

  return {
    ok: true,
    status: response.status,
    data: data as T,
    cartToken: nextCartToken,
    headers: response.headers,
  };
}

export async function getCart(cartToken?: string | null) {
  return wcStoreFetch({
    method: "GET",
    path: "/cart",
    cartToken,
  });
}

export async function getCheckout(cartToken?: string | null) {
  return wcStoreFetch({
    method: "GET",
    path: "/checkout",
    cartToken,
  });
}

export async function updateCheckout(
  payload: unknown,
  cartToken?: string | null,
  recalcTotals = true
) {
  return wcStoreFetch({
    method: "PUT",
    path: "/checkout",
    cartToken,
    body: payload,
    searchParams: {
      __experimental_calc_totals: recalcTotals,
    },
  });
}

export async function placeOrder(payload: unknown, cartToken?: string | null) {
  return wcStoreFetch({
    method: "POST",
    path: "/checkout",
    cartToken,
    body: payload,
  });
}