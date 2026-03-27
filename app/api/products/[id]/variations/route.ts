import { NextResponse } from "next/server";

function normalizeBaseUrl(input: string) {
  let base = String(input || "").trim();

  if (base && !/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  }

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

function formatMinorUnitPrice(raw: unknown, minorUnit = 2) {
  const n = Number(raw ?? 0);
  if (!Number.isFinite(n)) return "";
  return String(n / Math.pow(10, minorUnit));
}

function humanNameFromSlug(slug: string) {
  const clean = String(slug || "").replace(/^pa_/, "");
  if (!clean) return "";
  return clean
    .split("_")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ""))
    .join(" ");
}

function extractAttributesFromUrl(rawUrl?: string) {
  const out: { id?: number; name: string; slug?: string; option: string }[] = [];
  const value = String(rawUrl ?? "").trim();
  if (!value) return out;

  try {
    const url = new URL(value);

    for (const [key, val] of url.searchParams.entries()) {
      if (!key.startsWith("attribute_")) continue;

      const slug = key.replace(/^attribute_/, "").trim();
      const option = String(val ?? "").trim();

      if (!slug || !option) continue;

      out.push({
        name: humanNameFromSlug(slug),
        slug,
        option,
      });
    }
  } catch {
    return out;
  }

  return out;
}

function dedupeAttributes(
  attrs: { id?: number; name: string; slug?: string; option: string }[]
) {
  const seen = new Set<string>();
  const out: typeof attrs = [];

  for (const attr of attrs) {
    const key = `${String(attr.slug ?? "").trim()}::${String(attr.option ?? "").trim()}`;
    if (!attr.slug || !attr.option) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(attr);
  }

  return out;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ productId?: string; id?: string }> }
) {
  const params = await ctx.params;
  const idRaw = params.productId ?? params.id ?? "";
  const id = String(idRaw ?? "").trim();

  if (!id || id === "undefined" || id === "null") {
    return NextResponse.json(
      { error: "Missing or invalid product id" },
      { status: 400 }
    );
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

  const perPage = 100;
  let page = 1;
  const all: any[] = [];

  try {
    while (true) {
      const url = new URL(`${storeApiBase}/products`);
      url.searchParams.set("type", "variation");
      url.searchParams.set("parent", id);
      url.searchParams.set("per_page", String(perPage));
      url.searchParams.set("page", String(page));

      const { res, data } = await fetchJson(url.toString());

      if (!res.ok) {
        return NextResponse.json(
          {
            error:
              data?.message || data?.error || "WooCommerce Store API request failed",
            status: res.status,
            details: data,
            requestUrl: url.toString(),
            request: { page, per_page: perPage },
          },
          { status: res.status }
        );
      }

      const chunk = Array.isArray(data) ? data : [];
      all.push(...chunk);

      if (chunk.length < perPage) break;

      page += 1;
      if (page > 50) break;
    }

    const normalized = all.map((v: any) => {
      const minorUnit = Number(v?.prices?.currency_minor_unit ?? 2);

      const attributes = dedupeAttributes([
        ...extractAttributesFromUrl(v?.permalink),
        ...extractAttributesFromUrl(v?.add_to_cart?.url),
      ]);

      return {
        id: Number(v?.id),
        price: formatMinorUnitPrice(v?.prices?.price, minorUnit),
        regular_price: formatMinorUnitPrice(v?.prices?.regular_price, minorUnit),
        sale_price: formatMinorUnitPrice(v?.prices?.sale_price, minorUnit),
        in_stock:
          typeof v?.is_in_stock === "boolean" ? v.is_in_stock : undefined,
        stock_status: String(v?.stock_availability?.class === "in-stock" ? "instock" : ""),
        image:
          Array.isArray(v?.images) && v.images[0]?.src
            ? {
                src: normalizePublicWpUrl(String(v.images[0].src ?? "")),
              }
            : null,
        attributes,
      };
    });

    return NextResponse.json(normalized, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Failed to reach WooCommerce Store API",
        message: e?.message || String(e),
      },
      { status: 502 }
    );
  }
}