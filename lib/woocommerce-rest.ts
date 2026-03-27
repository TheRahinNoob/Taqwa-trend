type WooRestRequestInit = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  searchParams?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
};

export type WooRestSuccess<T = unknown> = {
  ok: true;
  status: number;
  data: T;
};

export type WooRestFailure = {
  ok: false;
  status: number;
  error: string;
  details: unknown;
};

export type WooRestResult<T = unknown> = WooRestSuccess<T> | WooRestFailure;

function getRestBaseUrl() {
  const baseUrl =
    process.env.WC_BASE_URL ||
    process.env.WOOCOMMERCE_STORE_API_BASE_URL ||
    process.env.NEXT_PUBLIC_WORDPRESS_URL;

  if (!baseUrl) {
    throw new Error(
      "Missing WooCommerce base URL. Set WC_BASE_URL or WOOCOMMERCE_STORE_API_BASE_URL."
    );
  }

  return String(baseUrl).replace(/\/+$/, "");
}

function getCredentials() {
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;

  if (!key || !secret) {
    throw new Error(
      "Missing WooCommerce REST credentials. Set WC_CONSUMER_KEY and WC_CONSUMER_SECRET."
    );
  }

  return { key, secret };
}

function buildUrl(
  path: string,
  searchParams?: Record<string, string | number | boolean | undefined | null>
) {
  const baseUrl = getRestBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl}/wp-json/wc/v3${normalizedPath}`);

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

export async function wcRestFetch<T = unknown>({
  method = "GET",
  path,
  searchParams,
  body,
}: WooRestRequestInit): Promise<WooRestResult<T>> {
  const { key, secret } = getCredentials();
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Basic ${auth}`,
  });

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path, searchParams), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const data = await safeParseJson(response);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error:
        (data as any)?.message ||
        (data as any)?.error ||
        `WooCommerce REST request failed with status ${response.status}`,
      details: data,
    };
  }

  return {
    ok: true,
    status: response.status,
    data: data as T,
  };
}