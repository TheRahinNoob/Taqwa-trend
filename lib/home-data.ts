import { Buffer } from "node:buffer";

export type WCProductLite = {
  id: number;
  name: string;
  slug: string;
  price: string;
  images?: Array<{ src: string; alt?: string }>;
  categories?: Array<{ id: number; name: string; slug: string }>;
};

export type BannerData = {
  desktop: string;
  tablet: string;
  mobile: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  featuredCategoryIds: number[];
};

export type HomeCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  image: { src: string; alt?: string } | null;
};

function normalizeBaseUrl(input: string) {
  let base = String(input || "").trim();
  if (!base) return "";
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base.replace(/\/+$/, "");
}

function stripStoreApiPath(url: string) {
  return url.replace(/\/wp-json\/wc\/store\/v1\/?$/i, "");
}

function getWpBase() {
  const raw =
    process.env.WC_BASE_URL ||
    process.env.NEXT_PUBLIC_WORDPRESS_URL ||
    process.env.WORDPRESS_API_URL ||
    process.env.WOOCOMMERCE_STORE_API_BASE_URL ||
    "";

  const normalized = normalizeBaseUrl(raw);
  if (!normalized) return "";

  return stripStoreApiPath(normalized);
}

function getStoreApiBase() {
  const raw =
    process.env.WOOCOMMERCE_STORE_API_BASE_URL ||
    process.env.WC_BASE_URL ||
    process.env.NEXT_PUBLIC_WORDPRESS_URL ||
    process.env.WORDPRESS_API_URL ||
    "";

  const normalized = normalizeBaseUrl(raw);
  if (!normalized) return "";

  if (normalized.includes("/wp-json/wc/store/v1")) {
    return normalized;
  }

  return `${normalized}/wp-json/wc/store/v1`;
}

function normalizePublicWpUrl(url?: string | null) {
  const raw = String(url ?? "").trim();
  if (!raw) return "";

  const publicWpBase = normalizeBaseUrl(process.env.NEXT_PUBLIC_WORDPRESS_URL || "");
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

async function fetchJson(url: string, headers?: HeadersInit) {
  const res = await fetch(url, {
    cache: "no-store",
    headers,
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { res, data };
}

function getWooAuth() {
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!key || !secret) return null;
  return Buffer.from(`${key}:${secret}`).toString("base64");
}

function formatStoreApiPrice(prices: any) {
  const raw = Number(prices?.price ?? 0);
  const minorUnit = Number(prices?.currency_minor_unit ?? 2);

  if (!Number.isFinite(raw) || !Number.isFinite(minorUnit)) return "";

  const value = raw / Math.pow(10, minorUnit);

  if (!Number.isFinite(value)) return "";

  return value.toFixed(minorUnit).replace(/\.00$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

export async function getHomeProducts(): Promise<WCProductLite[]> {
  const storeApiBase = getStoreApiBase();
  if (!storeApiBase) return [];

  const url = new URL(`${storeApiBase}/products`);
  url.searchParams.set("per_page", "8");
  url.searchParams.set("orderby", "date");
  url.searchParams.set("order", "desc");

  const { res, data } = await fetchJson(url.toString(), {
    Accept: "application/json",
  });

  if (!res.ok || !Array.isArray(data)) return [];

  return data
    .map((p: any) => {
      if (!p || !p.slug) return null;

      return {
        id: Number(p.id),
        name: String(p.name ?? ""),
        slug: String(p.slug ?? ""),
        price: formatStoreApiPrice(p?.prices),
        images: Array.isArray(p.images)
          ? p.images.map((img: any) => ({
              src: normalizePublicWpUrl(String(img?.src ?? "")),
              alt: String(img?.alt ?? ""),
            }))
          : [],
        categories: Array.isArray(p.categories)
          ? p.categories.map((c: any) => ({
              id: Number(c?.id),
              name: String(c?.name ?? ""),
              slug: String(c?.slug ?? ""),
            }))
          : [],
      } satisfies WCProductLite;
    })
    .filter(Boolean) as WCProductLite[];
}

async function resolveMediaUrl(base: string, value: unknown): Promise<string> {
  if (typeof value === "string" && /^https?:\/\//i.test(value)) {
    return normalizePublicWpUrl(value);
  }

  const id =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
        ? Number(value)
        : null;

  if (!id || !Number.isFinite(id)) return "";

  const { res, data } = await fetchJson(`${base}/wp-json/wp/v2/media/${id}`, {
    Accept: "application/json",
  });

  if (!res.ok || !data) return "";

  return normalizePublicWpUrl(String(data?.source_url ?? ""));
}

function toTermId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && /^\d+$/.test(value)) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  if (value && typeof value === "object") {
    const maybeId = (value as any).term_id ?? (value as any).id;
    const n = Number(maybeId);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

export async function getHomeBanner(): Promise<BannerData> {
  const wpBase = getWpBase();

  const fallback: BannerData = {
    desktop: "",
    tablet: "",
    mobile: "",
    title: "Sophisticated modestwear, designed for everyday elegance.",
    subtitle:
      "Discover premium abayas, kurtis, and carefully selected pieces crafted for comfort, refinement, and timeless style.",
    buttonText: "Shop Collection",
    buttonLink: "/products",
    featuredCategoryIds: [],
  };

  if (!wpBase) return fallback;

  const { res, data } = await fetchJson(`${wpBase}/wp-json/wp/v2/pages/2`, {
    Accept: "application/json",
  });

  if (!res.ok || !data) return fallback;

  const acf = data?.acf ?? {};

  const featuredCategoryIds = [
    acf.home_category_1,
    acf.home_category_2,
    acf.home_category_3,
    acf.home_category_4,
  ]
    .map(toTermId)
    .filter((id): id is number => Number.isFinite(id as number));

  return {
    desktop: await resolveMediaUrl(wpBase, acf.banner_desktop),
    tablet: await resolveMediaUrl(wpBase, acf.banner_tablet),
    mobile: await resolveMediaUrl(wpBase, acf.banner_mobile),
    title: String(acf.banner_title ?? fallback.title),
    subtitle: String(acf.banner_subtitle ?? fallback.subtitle),
    buttonText: String(acf.banner_button_text ?? fallback.buttonText),
    buttonLink: String(acf.banner_button_link ?? fallback.buttonLink) || "/products",
    featuredCategoryIds,
  };
}

export async function getHomeCategories(ids: number[]): Promise<HomeCategory[]> {
  const storeApiBase = getStoreApiBase();
  const wpBase = getWpBase();
  if (!storeApiBase || !ids.length) return [];

  const url = `${storeApiBase}/products/categories`;

  const { res, data } = await fetchJson(url, {
    Accept: "application/json",
  });

  if (!res.ok || !Array.isArray(data)) return [];

  const wanted = new Set(ids);

  return data
    .filter((c: any) => wanted.has(Number(c?.id)))
    .sort((a: any, b: any) => ids.indexOf(Number(a?.id)) - ids.indexOf(Number(b?.id)))
    .map((c: any) => {
      const imageSrc =
        c?.image && typeof c.image === "object" ? String(c.image.src ?? "") : "";

      return {
        id: Number(c?.id),
        name: String(c?.name ?? ""),
        slug: String(c?.slug ?? ""),
        description: String(c?.description ?? ""),
        count: Number(c?.count ?? 0),
        image: imageSrc
          ? {
              src: normalizePublicWpUrl(imageSrc),
              alt: String(c?.image?.alt ?? c?.name ?? ""),
            }
          : wpBase
            ? null
            : null,
      };
    });
}