import { NextResponse } from "next/server";

function normalizeBaseUrl(input: string) {
  let base = String(input || "").trim();

  if (!base) return "";

  if (!/^https?:\/\//i.test(base)) {
    base = `http://${base}`;
  }

  return base.replace(/\/+$/, "");
}

function getStoreApiBase() {
  const raw =
    process.env.WOOCOMMERCE_STORE_API_BASE_URL ||
    process.env.WC_BASE_URL ||
    process.env.NEXT_PUBLIC_WORDPRESS_URL;

  if (!raw) return "";

  const base = normalizeBaseUrl(raw);

  if (base.includes("/wp-json/wc/store/v1")) {
    return base;
  }

  return `${base}/wp-json/wc/store/v1`;
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

export async function GET(request: Request) {
  const storeApiBase = getStoreApiBase();

  if (!storeApiBase) {
    return NextResponse.json(
      {
        error: "Missing WooCommerce store API env var",
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
  const idsParam = String(searchParams.get("ids") ?? "").trim();

  const ids = idsParam
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);

  const url = `${storeApiBase}/products/categories`;

  try {
    const { res, data } = await fetchJson(url);

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data?.message || data?.error || "WooCommerce request failed",
          status: res.status,
          details: data,
          requestedUrl: url,
        },
        { status: res.status }
      );
    }

    let categories: any[] = Array.isArray(data) ? data : [];

    if (ids.length > 0) {
      const wanted = new Set(ids);
      categories = categories.filter((c) => wanted.has(Number(c?.id)));
      categories.sort(
        (a, b) => ids.indexOf(Number(a?.id)) - ids.indexOf(Number(b?.id))
      );
    }

    const out = categories
      .map((c) => ({
        id: Number(c?.id),
        name: String(c?.name ?? "").trim(),
        slug: String(c?.slug ?? "").trim(),
        description: String(c?.description ?? "").trim(),
        parent:
          typeof c?.parent === "number"
            ? c.parent
            : Number.isFinite(Number(c?.parent))
              ? Number(c.parent)
              : 0,
        count:
          typeof c?.count === "number"
            ? c.count
            : Number.isFinite(Number(c?.count))
              ? Number(c.count)
              : 0,
        image:
          c?.image && typeof c.image === "object"
            ? {
                src: String(c.image.src ?? "").trim(),
                alt: String(c.image.alt ?? c?.name ?? "").trim(),
              }
            : null,
        permalink: String(c?.permalink ?? "").trim(),
      }))
      .filter((c) => c.id > 0 && c.slug && c.name);

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch categories",
        message: e?.message || String(e),
        requestedUrl: url,
      },
      { status: 502 }
    );
  }
}