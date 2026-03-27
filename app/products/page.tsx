import { headers } from "next/headers";
import SiteHeader from "@/components/SiteHeader";
import ProductsViewClient from "@/components/ProductsViewClient";
import { WCProductLite } from "@/components/ProductCard";

type CategoryOption = {
  slug: string;
  name: string;
  count?: number;
};

function formatStoreApiPrice(prices: any) {
  const raw = Number(prices?.price ?? 0);
  const minorUnit = Number(prices?.currency_minor_unit ?? 2);

  if (!Number.isFinite(raw) || !Number.isFinite(minorUnit)) return "";

  const value = raw / Math.pow(10, minorUnit);

  if (!Number.isFinite(value)) return "";

  return value
    .toFixed(minorUnit)
    .replace(/\.00$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1");
}

function toLite(p: any): WCProductLite | null {
  if (!p || !p.slug) return null;

  return {
    id: Number(p.id),
    name: String(p.name ?? ""),
    slug: String(p.slug ?? ""),
    price: formatStoreApiPrice(p?.prices),
    images: Array.isArray(p.images) ? p.images : [],
    categories: Array.isArray(p.categories) ? p.categories : [],
  };
}

function toCategory(c: any): CategoryOption | null {
  const slug = String(c?.slug ?? "").trim();
  const name = String(c?.name ?? "").trim();

  if (!slug || !name) return null;

  return {
    slug,
    name,
    count:
      typeof c?.count === "number"
        ? c.count
        : Number.isFinite(Number(c?.count))
          ? Number(c.count)
          : 0,
  };
}

async function getApiBase() {
  const h = await headers();

  const forwardedHost = h.get("x-forwarded-host");
  const host = forwardedHost || h.get("host");
  const forwardedProto = h.get("x-forwarded-proto");

  if (host) {
    const proto =
      forwardedProto || (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

    return `${proto}://${host}`;
  }

  const explicit = String(process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  return "http://localhost:3000";
}

async function fetchJson(path: string) {
  const base = await getApiBase();
  const res = await fetch(`${base}${path}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });
  const data = await res.json().catch(() => null);
  return { res, data };
}

export default async function ProductsPage() {
  let products: WCProductLite[] = [];
  let categories: CategoryOption[] = [];
  let loadError: string | null = null;

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetchJson("/api/products"),
      fetchJson("/api/categories"),
    ]);

    if (!productsRes.res.ok) {
      loadError =
        (productsRes.data &&
          (productsRes.data.error || productsRes.data.message)) ||
        `Failed to load products (${productsRes.res.status})`;
    } else {
      const rawProducts = Array.isArray(productsRes.data) ? productsRes.data : [];
      products = rawProducts.map(toLite).filter(Boolean) as WCProductLite[];
    }

    if (categoriesRes.res.ok) {
      const rawCategories = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
      categories = rawCategories.map(toCategory).filter(Boolean) as CategoryOption[];
    } else {
      categories = [];
    }
  } catch (e: any) {
    loadError = e?.message || "Failed to load products.";
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(0,0,0,0.06),transparent),radial-gradient(900px_500px_at_90%_0%,rgba(0,0,0,0.05),transparent)]">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-10">
        {loadError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <div className="font-semibold">Products unavailable</div>
            <div className="mt-1">API error. Please try again.</div>
            <div className="mt-2 text-xs opacity-80">{loadError}</div>
          </div>
        ) : null}

        <section id="grid" className={loadError ? "mt-10" : ""}>
          <ProductsViewClient
            initialProducts={products}
            allCategories={categories}
          />
        </section>
      </main>
    </div>
  );
}