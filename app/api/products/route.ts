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
  if (base && !/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base.replace(/\/+$/, "");
}

function safeTrim(x: string | null) {
  return (x ?? "").trim();
}

function toFiniteNumber(x: string | null) {
  if (!x) return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
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

async function fetchJson(url: string) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const text = await res.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: "Non-JSON response from WooCommerce", raw: text };
  }

  return { res, data };
}

export async function GET(request: Request) {
  const baseRaw =
    process.env.WOOCOMMERCE_STORE_API_BASE_URL ||
    process.env.WC_BASE_URL ||
    process.env.NEXT_PUBLIC_WORDPRESS_URL;

  const base = baseRaw ? normalizeBaseUrl(baseRaw) : "";

  if (!base) {
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

  const { searchParams } = new URL(request.url);

  const q = safeTrim(searchParams.get("q"));
  const cat = safeTrim(searchParams.get("cat"));
  const min = toFiniteNumber(searchParams.get("min"));
  const max = toFiniteNumber(searchParams.get("max"));

  const sortRaw = safeTrim(searchParams.get("sort"));
  const sort: "latest" | "name_asc" | "price_asc" | "price_desc" =
    sortRaw === "name_asc" ||
    sortRaw === "price_asc" ||
    sortRaw === "price_desc" ||
    sortRaw === "latest"
      ? sortRaw
      : "latest";

  const storeBase = base.includes("/wp-json/wc/store/v1")
    ? base
    : `${base.replace(/\/+$/, "")}/wp-json/wc/store/v1`;

  const url = new URL(`${storeBase}/products`);

  url.searchParams.set("per_page", "100");

  let orderby: "date" | "title" | "price" = "date";
  let order: "asc" | "desc" = "desc";

  if (sort === "name_asc") {
    orderby = "title";
    order = "asc";
  } else if (sort === "price_asc") {
    orderby = "price";
    order = "asc";
  } else if (sort === "price_desc") {
    orderby = "price";
    order = "desc";
  }

  url.searchParams.set("orderby", orderby);
  url.searchParams.set("order", order);

  if (q) url.searchParams.set("search", q);

  if (cat && cat !== "all") {
    url.searchParams.set("category", cat);
  }

  if (typeof min === "number") url.searchParams.set("min_price", String(min));
  if (typeof max === "number") url.searchParams.set("max_price", String(max));

  try {
    const { res, data } = await fetchJson(url.toString());

    if (!res.ok) {
      const err = data as Record<string, unknown> | null;

      return NextResponse.json(
        {
          error:
            (typeof err?.message === "string" && err.message) ||
            (typeof err?.error === "string" && err.error) ||
            "WooCommerce Store API request failed",
          status: res.status,
          details: data,
          upstreamUrl: url.toString(),
        },
        { status: res.status }
      );
    }

    const products: WcProduct[] = Array.isArray(data) ? (data as WcProduct[]) : [];
    const normalizedProducts = products.map(normalizeProduct);

    return NextResponse.json(normalizedProducts, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);

    return NextResponse.json(
      { error: "Failed to reach WooCommerce Store API", message },
      { status: 502 }
    );
  }
}