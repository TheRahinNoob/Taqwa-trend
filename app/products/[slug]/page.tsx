import Link from "next/link";
import { headers } from "next/headers";
import ProductDetailClient from "@/components/ProductDetailClient";
import ProductCard, { WCProductLite } from "@/components/ProductCard";

function toLite(p: any): WCProductLite | null {
  if (!p || !p.slug) return null;
  return {
    id: Number(p.id),
    name: String(p.name ?? ""),
    slug: String(p.slug ?? ""),
    price: p.price ?? "",
    images: Array.isArray(p.images) ? p.images : [],
    categories: Array.isArray(p.categories) ? p.categories : [],
  };
}

async function getRequestBaseUrl() {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => null);
  return { res, data };
}

function StateCard({
  title,
  description,
  href = "/products",
  buttonLabel = "Back to shop",
  debug,
}: {
  title: string;
  description: string;
  href?: string;
  buttonLabel?: string;
  debug?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom,#fcfcfd,#f8f8fa)]">
      <main className="mx-auto w-full max-w-6xl px-3 pb-12 pt-4 sm:px-4 sm:pb-16 sm:pt-8 lg:px-5">
        <div className="rounded-[24px] border border-black/8 bg-white/88 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] backdrop-blur sm:rounded-[28px] sm:p-8">
          <div className="mx-auto max-w-xl text-center">
            <div className="text-[17px] font-semibold tracking-[-0.03em] text-neutral-950 sm:text-base">
              {title}
            </div>
            <div className="mt-2 text-sm leading-6 text-neutral-600">
              {description}
            </div>

            {debug ? (
              <div className="mt-4 rounded-[20px] border border-black/8 bg-neutral-50/90 p-4 text-left text-xs text-neutral-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                {debug}
              </div>
            ) : null}

            <div className="mt-6">
              <Link
                href={href}
                className="inline-flex min-h-[42px] w-full items-center justify-center rounded-full border border-black/10 bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-neutral-800 active:scale-[0.985] sm:min-h-[44px] sm:w-auto"
              >
                {buttonLabel}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default async function ProductPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const baseUrl = await getRequestBaseUrl();

  const { res, data: product } = await fetchJson(
    `${baseUrl}/api/products/slug/${encodeURIComponent(slug)}`
  );

  if (res.status === 404) {
    return (
      <StateCard
        title="Product not found"
        description="This item may be unavailable right now."
      />
    );
  }

  if (!res.ok) {
    return (
      <StateCard
        title="Product unavailable"
        description="Please try again in a moment."
        debug={
          process.env.NODE_ENV === "development" ? (
            <>
              <div className="font-semibold">Debug</div>
              <div className="mt-1">Status: {res.status}</div>
              <div className="mt-1 break-all">
                Fetch: {`${baseUrl}/api/products/slug/${slug}`}
              </div>
            </>
          ) : null
        }
      />
    );
  }

  if (!product) {
    return (
      <StateCard
        title="Product not found"
        description="This item may be unavailable right now."
      />
    );
  }

  const primaryCatSlug =
    product?.categories?.[0]?.slug ? String(product.categories[0].slug) : "";

  let related: WCProductLite[] = [];

  if (primaryCatSlug) {
    const { res: relRes, data: relRaw } = await fetchJson(
      `${baseUrl}/api/products?cat=${encodeURIComponent(
        primaryCatSlug
      )}&sort=featured`
    );

    if (relRes.ok && Array.isArray(relRaw)) {
      const currentId = Number(product?.id);
      related = relRaw.map(toLite).filter(Boolean) as WCProductLite[];
      related = related.filter((p) => p.id !== currentId).slice(0, 8);
    }
  }

  const WHATSAPP_NUMBER = ""; // "88017XXXXXXXX"

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom,#fcfcfd,#f8f8fa)] text-neutral-950 antialiased">
      <ProductDetailClient product={product} whatsappNumber={WHATSAPP_NUMBER} />

      {related.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-3 pb-12 sm:px-4 sm:pb-16 lg:px-5">
          <div className="mt-8 overflow-hidden rounded-[24px] border border-black/8 bg-white/88 shadow-[0_10px_30px_rgba(0,0,0,0.05)] backdrop-blur sm:mt-10 sm:rounded-[28px]">
            <div className="p-4 sm:p-6 lg:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <div className="text-[18px] font-semibold tracking-[-0.03em] text-neutral-950 sm:text-xl">
                    Related products
                  </div>
                  <div className="mt-1 text-sm text-neutral-600">
                    More from the same collection
                  </div>
                </div>

                <Link
                  href={`/products?cat=${encodeURIComponent(primaryCatSlug)}`}
                  className="hidden min-h-[42px] items-center justify-center rounded-full border border-black/10 bg-white/90 px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition duration-200 hover:bg-neutral-50 active:scale-[0.985] sm:inline-flex"
                >
                  View all →
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:mt-5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {related.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>

              <div className="mt-5 sm:hidden">
                <Link
                  href={`/products?cat=${encodeURIComponent(primaryCatSlug)}`}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[16px] bg-neutral-900 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-neutral-800 active:scale-[0.985]"
                >
                  View all in this category →
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}