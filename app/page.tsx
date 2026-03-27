import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import ProductCard from "@/components/ProductCard";
import {
  getHomeBanner,
  getHomeCategories,
  getHomeProducts,
  type BannerData,
  type HomeCategory,
} from "@/lib/home-data";

function getSafeHref(href: string) {
  const v = String(href || "").trim();
  if (!v) return "/products";
  return v;
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function BannerPrimaryCTA({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const safeHref = getSafeHref(href);

  const className = [
    "inline-flex w-full min-w-0 max-w-full items-center justify-center",
    "h-11 sm:h-[46px]",
    "rounded-full border border-white/55 bg-white/88",
    "px-4 sm:px-5",
    "text-center text-[13px] sm:text-sm",
    "font-semibold tracking-[-0.01em] text-neutral-950",
    "backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_8px_20px_rgba(255,255,255,0.08)]",
    "transition-transform duration-200 active:scale-[0.985] hover:bg-white/92",
    "whitespace-nowrap",
    "sm:w-auto",
  ].join(" ");

  const content = <span className="block w-full truncate">{label} →</span>;

  if (isExternalHref(safeHref)) {
    return (
      <a href={safeHref} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={safeHref} className={className}>
      {content}
    </Link>
  );
}

function BannerImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_25%),linear-gradient(135deg,#111827_0%,#1f2937_45%,#0f172a_100%)]" />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      loading="eager"
    />
  );
}

function CategoryCard({ item }: { item: HomeCategory }) {
  const href = `/products?cat=${encodeURIComponent(item.slug)}`;
  const badge =
    item.count > 0 ? `${item.count} item${item.count === 1 ? "" : "s"}` : "Collection";

  return (
    <Link
      href={href}
      className={[
        "group relative block min-w-0 overflow-hidden",
        "rounded-[clamp(16px,4.4vw,24px)] border border-white/18 bg-white/[0.06]",
        "backdrop-blur-xl",
        "shadow-[0_1px_0_rgba(255,255,255,0.05),0_12px_30px_rgba(0,0,0,0.14)]",
        "transition duration-300 active:scale-[0.985]",
        "hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(255,255,255,0.06),0_18px_42px_rgba(0,0,0,0.16)]",
      ].join(" ")}
    >
      <div className="relative aspect-[0.8/1] min-h-[clamp(150px,56vw,280px)] overflow-hidden">
        {item.image?.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image.src}
            alt={item.image.alt || item.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_25%),linear-gradient(135deg,#1f2937_0%,#111827_100%)]" />
        )}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.02),rgba(0,0,0,0.07)_26%,rgba(0,0,0,0.34)_58%,rgba(0,0,0,0.84)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(255,255,255,0.18),transparent_18%),radial-gradient(circle_at_84%_18%,rgba(255,255,255,0.08),transparent_16%)]" />

        <div className="absolute left-[clamp(6px,2.2vw,12px)] top-[clamp(6px,2.2vw,12px)] max-w-[calc(100%-12px)]">
          <div
            className={[
              "inline-flex max-w-full min-w-0 items-center gap-[clamp(4px,1.5vw,8px)] rounded-full",
              "border border-white/18 bg-white/12 backdrop-blur-xl",
              "px-[clamp(6px,2.4vw,10px)] py-[clamp(4px,1.5vw,6px)]",
              "text-[clamp(7px,2.5vw,11px)] font-semibold uppercase tracking-[0.12em] text-white/90",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
            ].join(" ")}
          >
            <span className="inline-block h-[clamp(4px,1.3vw,6px)] w-[clamp(4px,1.3vw,6px)] shrink-0 rounded-full bg-white/90" />
            <span className="truncate">{badge}</span>
          </div>
        </div>

        <div className="absolute bottom-[clamp(6px,2.2vw,12px)] left-[clamp(6px,2.2vw,12px)] right-[clamp(6px,2.2vw,12px)]">
          <div
            className={[
              "relative overflow-hidden",
              "rounded-[clamp(12px,4vw,22px)] border border-white/16 bg-white/[0.10]",
              "p-[clamp(7px,2.6vw,14px)]",
              "backdrop-blur-2xl shadow-[0_8px_24px_rgba(0,0,0,0.18)]",
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.14),rgba(255,255,255,0.03))]" />

            <div className="relative flex min-w-0 items-end gap-[clamp(6px,2vw,12px)]">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[clamp(7px,2.2vw,11px)] font-medium uppercase tracking-[0.12em] text-white/58">
                  Collection
                </div>

                <div className="mt-[clamp(2px,1vw,4px)] line-clamp-2 break-words text-[clamp(11px,3.7vw,20px)] font-semibold leading-[1.08] tracking-[-0.03em] text-white">
                  {item.name}
                </div>
              </div>

              <div
                className={[
                  "grid shrink-0 place-items-center",
                  "h-[clamp(22px,8vw,40px)] w-[clamp(22px,8vw,40px)]",
                  "rounded-[clamp(10px,3vw,18px)] border border-white/14 bg-white/[0.12]",
                  "text-[clamp(9px,3vw,13px)] text-white/95",
                  "backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] transition",
                  "group-hover:bg-white/[0.16]",
                ].join(" ")}
              >
                ↗
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function TrustCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[clamp(14px,4vw,22px)] border border-black/8 bg-white/88 p-[clamp(10px,3vw,16px)] shadow-[0_6px_18px_rgba(0,0,0,0.04)] backdrop-blur">
      <div className="text-[clamp(9px,2.4vw,11px)] font-medium uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-[clamp(12px,3.2vw,15px)] font-semibold leading-5 text-neutral-900">
        {value}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [products, banner] = await Promise.all([
    getHomeProducts(),
    getHomeBanner(),
  ]);

  const homeCategories = await getHomeCategories(banner.featuredCategoryIds);

  const featured = products.slice(0, 8);

  const desktopBanner = banner.desktop || banner.tablet || banner.mobile;
  const tabletBanner = banner.tablet || banner.desktop || banner.mobile;
  const mobileBanner = banner.mobile || banner.tablet || banner.desktop;

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(0,0,0,0.05),transparent),radial-gradient(900px_500px_at_90%_0%,rgba(0,0,0,0.04),transparent),linear-gradient(to_bottom,#fafaf9,#f7f7f6)] text-neutral-950 [font-synthesis-weight:none] antialiased">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-[clamp(8px,3vw,20px)] pb-[clamp(40px,8vw,64px)] pt-[clamp(8px,3vw,24px)]">
        <section className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04),0_14px_34px_rgba(0,0,0,0.07)]">
          <div className="relative">
            <div className="relative block h-[420px] min-[380px]:h-[470px] md:hidden">
              <BannerImage src={mobileBanner} alt="Taqwa Trend mobile banner" />
            </div>

            <div className="relative hidden h-[560px] md:block lg:hidden">
              <BannerImage src={tabletBanner} alt="Taqwa Trend tablet banner" />
            </div>

            <div className="relative hidden h-[620px] lg:block">
              <BannerImage src={desktopBanner} alt="Taqwa Trend desktop banner" />
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.06),rgba(0,0,0,0.14)_26%,rgba(0,0,0,0.58)_72%,rgba(0,0,0,0.78)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(255,255,255,0.10),transparent_22%),radial-gradient(circle_at_84%_16%,rgba(255,255,255,0.05),transparent_18%)]" />

            <div className="absolute inset-0 flex items-end">
              <div className="w-full p-4 pb-5 min-[380px]:p-5 min-[380px]:pb-6 sm:p-8 lg:p-10">
                <div className="max-w-2xl min-w-0">
                  <div className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:text-xs">
                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-white/90" />
                    <span className="truncate">Premium modestwear • Cash on delivery</span>
                  </div>

                  <h1 className="mt-4 max-w-[12ch] text-[24px] font-semibold leading-[0.98] tracking-[-0.045em] text-white min-[380px]:max-w-[13ch] min-[380px]:text-[30px] sm:mt-5 sm:max-w-[14ch] sm:text-[42px] lg:max-w-none lg:text-[56px]">
                    {banner.title || "Sophisticated modestwear, designed for everyday elegance."}
                  </h1>

                  <p className="mt-3 max-w-[34ch] whitespace-pre-line text-[13px] leading-[1.55] text-white/84 min-[380px]:max-w-[36ch] min-[380px]:text-[14px] sm:max-w-xl sm:text-sm sm:leading-6 lg:text-base">
                    {banner.subtitle ||
                      "Discover premium abayas, kurtis, and carefully selected pieces crafted for comfort, refinement, and timeless style."}
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                    <BannerPrimaryCTA
                      href={banner.buttonLink}
                      label={banner.buttonText || "Shop Collection"}
                    />

                    <a
                      href="#featured"
                      className={[
                        "inline-flex w-full min-w-0 max-w-full items-center justify-center",
                        "h-10 sm:h-[46px]",
                        "rounded-full border border-white/20 bg-white/10",
                        "px-4 sm:px-5",
                        "text-center text-[13px] sm:text-sm",
                        "font-semibold text-white backdrop-blur-md transition-transform duration-200 hover:bg-white/14 active:scale-[0.985]",
                        "whitespace-nowrap",
                        "sm:w-auto",
                      ].join(" ")}
                    >
                      <span className="block w-full truncate">View featured</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-[clamp(14px,4vw,24px)]">
          {homeCategories.length > 0 ? (
            <div className="grid grid-cols-1 gap-[clamp(8px,2.6vw,16px)] min-[360px]:grid-cols-2 lg:grid-cols-4">
              {homeCategories.map((item) => (
                <CategoryCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/products"
                className="rounded-[clamp(18px,5vw,26px)] border border-dashed border-black/15 bg-white p-[clamp(12px,4vw,20px)] shadow-sm"
              >
                <div className="text-[clamp(9px,2.5vw,12px)] font-medium uppercase tracking-[0.12em] text-neutral-500">
                  Collection
                </div>
                <div className="mt-2 text-[clamp(15px,4vw,18px)] font-semibold tracking-tight text-neutral-950">
                  Add homepage categories
                </div>
                <div className="mt-1 text-[clamp(12px,3vw,14px)] leading-[1.6] text-neutral-600">
                  Select Home Category fields in WordPress to show curated collections here.
                </div>
              </Link>
            </div>
          )}
        </section>

        <section className="mt-[clamp(14px,4vw,24px)] grid grid-cols-1 gap-[clamp(8px,2.5vw,12px)] sm:grid-cols-3">
          <TrustCard label="Ordering" value="Quick confirmation" />
          <TrustCard label="Delivery" value="Cash on delivery nationwide" />
          <TrustCard label="Support" value="Fast replies, smooth ordering" />
        </section>

        <section id="featured" className="mt-[clamp(24px,7vw,40px)]">
          <div className="flex flex-col gap-[clamp(10px,3vw,16px)] sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-[clamp(18px,4.8vw,32px)] font-semibold tracking-[-0.03em] text-neutral-950">
                Featured products
              </h2>
              <p className="mt-1 text-[clamp(11px,3vw,14px)] text-neutral-600">
                Handpicked pieces from the latest collection.
              </p>
            </div>

            <Link
              href="/products"
              className="hidden rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 active:scale-[0.98] sm:inline-flex"
            >
              View all →
            </Link>
          </div>

          <div className="mt-[clamp(12px,3vw,20px)] grid grid-cols-1 gap-[clamp(8px,2.6vw,16px)] min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>

          {featured.length === 0 ? (
            <div className="mt-5 rounded-[clamp(18px,5vw,28px)] border border-dashed border-black/15 bg-white p-[clamp(16px,5vw,40px)] text-center shadow-sm">
              <div className="text-[clamp(14px,4vw,16px)] font-semibold text-neutral-900">
                No featured products yet
              </div>
              <div className="mt-1 text-[clamp(12px,3vw,14px)] text-neutral-600">
                Add products in WooCommerce and they’ll appear here.
              </div>
            </div>
          ) : null}

          <div className="mt-[clamp(14px,4vw,20px)] sm:hidden">
            <Link
              href="/products"
              className="inline-flex min-h-[clamp(38px,8vw,48px)] w-full items-center justify-center rounded-[clamp(14px,4vw,18px)] bg-neutral-900 px-[clamp(12px,4vw,20px)] py-[clamp(8px,2.5vw,12px)] text-center text-[clamp(11px,3.2vw,14px)] font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.98]"
            >
              <span className="truncate">View all products →</span>
            </Link>
          </div>
        </section>

        <section className="mt-[clamp(24px,7vw,40px)] overflow-hidden rounded-[clamp(18px,5vw,28px)] border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <div className="grid gap-0 lg:grid-cols-[1.12fr_0.88fr]">
            <div className="p-[clamp(12px,4vw,32px)]">
              <div className="inline-flex max-w-full rounded-full border border-black/10 bg-neutral-50 px-[clamp(8px,2.8vw,12px)] py-[clamp(4px,1.4vw,6px)] text-[clamp(8px,2.3vw,11px)] font-semibold uppercase tracking-[0.12em] text-neutral-700">
                <span className="truncate">New season edit</span>
              </div>

              <h3 className="mt-[clamp(8px,2.5vw,16px)] text-[clamp(18px,5vw,30px)] font-semibold leading-tight tracking-[-0.03em] text-neutral-950">
                Thoughtful pieces for graceful everyday wear.
              </h3>

              <p className="mt-[clamp(6px,2vw,12px)] text-[clamp(12px,3vw,16px)] leading-[1.55] text-neutral-600">
                Shop refined designs, versatile colors, and premium fabrics made for
                comfort and confidence.
              </p>

              <div className="mt-[clamp(10px,4vw,24px)]">
                <Link
                  href="/products"
                  className="inline-flex min-h-[clamp(36px,8vw,46px)] min-w-0 max-w-full items-center justify-center rounded-[clamp(14px,4vw,18px)] bg-neutral-900 px-[clamp(10px,4vw,18px)] py-[clamp(8px,2.5vw,12px)] text-center text-[clamp(11px,3.2vw,14px)] font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.98]"
                >
                  <span className="truncate">Explore the full collection →</span>
                </Link>
              </div>
            </div>

            <div className="relative min-h-[clamp(150px,46vw,220px)] border-t border-black/10 lg:min-h-full lg:border-l lg:border-t-0">
              <BannerImage
                src={desktopBanner || tabletBanner || mobileBanner || ""}
                alt="Taqwa Trend collection banner"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}