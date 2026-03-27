import { NextResponse } from "next/server";

type WcImage = {
  id?: number;
  src?: string;
  name?: string;
  alt?: string;
  srcset?: string;
  sizes?: string;
  thumbnail?: string;
  [key: string]: unknown;
};

type WcLinkItem = {
  href?: string;
  [key: string]: unknown;
};

type WcProduct = {
  permalink?: string;
  images?: WcImage[];
  _links?: Record<string, WcLinkItem[]>;
  [key: string]: unknown;
};

function normalizeBaseUrl(input: string) {
  let base = String(input || "").trim();
  if (!base) return "";
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base.replace(/\/+$/, "");
}

function getStoreApiBase() {
  const raw =
    process.env.WOOCOMMERCE_STORE_API_BASE_URL ||
    process.env.WC_BASE_URL ||
    process.env.NEXT_PUBLIC_WORDPRESS_URL ||
    "";

  const base = normalizeBaseUrl(raw);
  if (!base) return "";

  if (base.includes("/wp-json/wc/store/v1")) {
    return base;
  }

  return `${base}/wp-json/wc/store/v1`;
}

function getPublicWpBase() {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_WORDPRESS_URL || "");
}

function normalizePublicWpUrl(url?: string | null) {
  const raw = String(url ?? "").trim();
  if (!raw) return "";

  const publicWpBase = getPublicWpBase();
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

function normalizeSrcset(srcset?: string | null) {
  const raw = String(srcset ?? "").trim();
  if (!raw) return "";

  return raw
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return "";

      const firstSpace = trimmed.indexOf(" ");
      if (firstSpace === -1) {
        return normalizePublicWpUrl(trimmed);
      }

      const urlPart = trimmed.slice(0, firstSpace);
      const descriptor = trimmed.slice(firstSpace + 1);
      return `${normalizePublicWpUrl(urlPart)} ${descriptor}`;
    })
    .filter(Boolean)
    .join(", ");
}

function normalizeLinks(
  links?: Record<string, WcLinkItem[]>
): Record<string, WcLinkItem[]> | undefined {
  if (!links || typeof links !== "object") return links;

  const out: Record<string, WcLinkItem[]> = {};

  for (const [key, items] of Object.entries(links)) {
    out[key] = Array.isArray(items)
      ? items.map((item) => ({
          ...item,
          href: normalizePublicWpUrl(
            typeof item?.href === "string" ? item.href : ""
          ),
        }))
      : [];
  }

  return out;
}

function normalizeProduct(product: WcProduct): WcProduct {
  return {
    ...product,
    permalink: normalizePublicWpUrl(
      typeof product.permalink === "string" ? product.permalink : ""
    ),
    images: Array.isArray(product.images)
      ? product.images.map((img) => ({
          ...img,
          src: normalizePublicWpUrl(
            typeof img?.src === "string" ? img.src : ""
          ),
          srcset: normalizeSrcset(
            typeof img?.srcset === "string" ? img.srcset : ""
          ),
          thumbnail: normalizePublicWpUrl(
            typeof img?.thumbnail === "string" ? img.thumbnail : ""
          ),
        }))
      : [],
    _links: normalizeLinks(product._links),
  };
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: "Non-JSON response from WooCommerce", raw: text };
  }

  return { res, data };
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;

  const s = String(slug ?? "").trim();
  if (!s || s === "undefined" || s === "null") {
    return badRequest("Missing or invalid slug");
  }

  const storeApiBase = getStoreApiBase();

  if (!storeApiBase) {
    return NextResponse.json(
      {
        error: "Missing WooCommerce Store API base URL",
        has: {
          WOOCOMMERCE_STORE_API_BASE_URL: !!process.env.WOOCOMMERCE_STORE_API_BASE_URL,
          WC_BASE_URL: !!process.env.WC_BASE_URL,
          NEXT_PUBLIC_WORDPRESS_URL: !!process.env.NEXT_PUBLIC_WORDPRESS_URL,
        },
      },
      { status: 500 }
    );
  }

  const url = new URL(`${storeApiBase}/products`);
  url.searchParams.set("slug", s);
  url.searchParams.set("per_page", "1");

  try {
    const { res, data } = await fetchJson(url.toString());

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data?.message || data?.error || "WooCommerce Store API request failed",
          status: res.status,
          details: data,
          upstreamUrl: url.toString(),
        },
        { status: res.status }
      );
    }

    const arr = Array.isArray(data) ? data : [];
    const product = arr[0] ?? null;

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(normalizeProduct(product), { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch product",
        message: e?.message || String(e),
      },
      { status: 502 }
    );
  }
}