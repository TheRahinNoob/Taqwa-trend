"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import ProductGalleryClient from "@/components/ProductGalleryClient";
import RichText from "@/components/RichText";
import VariantSelectorClient from "@/components/VariantSelectorClient";
import AddToCartButton from "@/components/AddToCartButton";

function formatBDT(price: unknown) {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `৳ ${n.toLocaleString("en-US")}`;
}

function formatStoreApiPrice(prices: any) {
  const raw = Number(prices?.price ?? 0);
  const minorUnit = Number(prices?.currency_minor_unit ?? 2);

  if (!Number.isFinite(raw) || !Number.isFinite(minorUnit)) return null;

  const value = raw / Math.pow(10, minorUnit);

  if (!Number.isFinite(value) || value <= 0) return null;

  return `৳ ${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: minorUnit,
  })}`;
}

function safeArray<T = any>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

function stripHtml(html: unknown) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeBaseUrl(input: string) {
  let base = String(input || "").trim();
  if (base && !/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base.replace(/\/+$/, "");
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

function norm(x: unknown) {
  return String(x ?? "").trim().toLowerCase();
}

function slugToLabel(value: string) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  return clean
    .split("-")
    .map((part) =>
      part ? part.charAt(0).toUpperCase() + part.slice(1) : ""
    )
    .join(" ");
}

function getVariationInStock(v: any): boolean | null {
  if (!v) return null;
  if (typeof v.in_stock === "boolean") return v.in_stock;
  if (typeof v.is_in_stock === "boolean") return v.is_in_stock;
  if (typeof v.stock_status === "string") {
    return v.stock_status.toLowerCase() === "instock";
  }
  return null;
}

function getBaseInStock(product: any) {
  if (typeof product?.is_in_stock === "boolean") return product.is_in_stock;
  if (typeof product?.in_stock === "boolean") return product.in_stock;
  if (typeof product?.stock_status === "string") {
    return product.stock_status.toLowerCase() === "instock";
  }
  if (typeof product?.stock_availability?.class === "string") {
    return product.stock_availability.class === "in-stock";
  }
  return false;
}

function extractAttributeTerms(product: any, want: "color" | "size") {
  const attrs = safeArray(product?.attributes);

  const attr =
    attrs.find((a: any) => norm(a?.taxonomy) === (want === "color" ? "pa_color" : "pa_size")) ||
    attrs.find((a: any) => norm(a?.slug) === (want === "color" ? "pa_color" : "pa_size")) ||
    attrs.find((a: any) => norm(a?.name) === want) ||
    attrs.find((a: any) => norm(a?.name).includes(want));

  const terms = safeArray(attr?.terms);

  return terms
    .map((term: any) => {
      const slug = String(term?.slug ?? "").trim();
      const name = String(term?.name ?? "").trim();

      if (!slug && !name) return null;

      return {
        slug: slug || name,
        label: name || slugToLabel(slug),
      };
    })
    .filter(Boolean) as { slug: string; label: string }[];
}

type Props = {
  product: any;
  whatsappNumber?: string;
};

function InfoPill({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className={[
        "inline-flex max-w-full min-w-0 items-center rounded-full px-[clamp(10px,3vw,16px)] py-[clamp(7px,2vw,10px)]",
        "text-[clamp(11px,3vw,14px)] font-semibold tracking-[-0.01em]",
        dark
          ? "bg-neutral-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
          : "border border-black/8 bg-white/78 text-neutral-700 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]",
      ].join(" ")}
    >
      <span className="truncate">{children}</span>
    </div>
  );
}

function GlassStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[clamp(16px,4vw,22px)] border border-black/8 bg-white/76 p-[clamp(10px,3vw,16px)] backdrop-blur-xl shadow-[0_10px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div className="text-[clamp(9px,2.4vw,11px)] font-medium uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-[clamp(12px,3.1vw,15px)] font-semibold leading-[1.35] text-neutral-900">
        {value}
      </div>
    </div>
  );
}

function OrderPolicySection({
  items,
  compact = false,
}: {
  items: string[];
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[clamp(18px,4vw,24px)] border border-black/8 bg-white/78 backdrop-blur-xl",
        "shadow-[0_16px_40px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.74)]",
        compact
          ? "p-[clamp(12px,4vw,18px)]"
          : "p-[clamp(12px,3vw,20px)]",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-full border border-black/8 bg-neutral-950 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]">
          Order Policy
        </div>
        <div className="text-[clamp(11px,2.8vw,13px)] text-neutral-500">
          Please review before placing your order
        </div>
      </div>

      <div className="mt-4 grid gap-2.5">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-[16px] border border-black/6 bg-white/70 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
          >
            <div className="mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[10px] font-semibold text-white">
              {index + 1}
            </div>
            <p className="text-[clamp(11px,2.9vw,14px)] leading-[1.6] text-neutral-700">
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductDetailClient({
  product,
  whatsappNumber = "",
}: Props) {
  const images = useMemo(
    () =>
      safeArray(product?.images).map((img: any) => ({
        ...img,
        src: normalizePublicWpUrl(String(img?.src ?? "")),
        thumbnail: normalizePublicWpUrl(String(img?.thumbnail ?? "")),
        alt: String(img?.alt ?? ""),
        name: String(img?.name ?? ""),
      })),
    [product?.images]
  );

  const cats = safeArray(product?.categories);

  const category = cats[0]?.name ?? "Collection";
  const baseInStock = getBaseInStock(product);

  const colorTerms = useMemo(() => extractAttributeTerms(product, "color"), [product]);
  const sizeTerms = useMemo(() => extractAttributeTerms(product, "size"), [product]);

  const colors = useMemo(() => colorTerms.map((t) => t.slug), [colorTerms]);
  const sizes = useMemo(() => sizeTerms.map((t) => t.slug || t.label), [sizeTerms]);

  const colorLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const term of colorTerms) {
      map.set(norm(term.slug), term.label);
    }
    return map;
  }, [colorTerms]);

  const sizeLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const term of sizeTerms) {
      map.set(norm(term.slug), term.label);
    }
    return map;
  }, [sizeTerms]);

  const isVariable =
    product?.type === "variable" &&
    colors.length > 0 &&
    sizes.length > 0;

  const basePriceLabel =
    formatStoreApiPrice(product?.prices) ||
    formatBDT(product?.price) ||
    (product?.price_html ? stripHtml(product.price_html) : null);

  const baseWaLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : `https://wa.me/`;
  const baseWaText = `Assalamu alaikum! I want to order: ${product?.name}.`;

  const orderPolicyItems = [
    "Orders are confirmed only after our team verifies product availability and contacts you.",
    "Cash on delivery is available for eligible locations inside Bangladesh.",
    "Please provide your correct name, phone number, and full delivery address while ordering.",
    "Delivery time may vary depending on your location, courier conditions, and stock availability.",
    "Slight color variation may happen because of lighting, device display, or photography settings.",
    "If you need size or product assistance before ordering, please contact us first on WhatsApp.",
  ];

  const [selected, setSelected] = useState<{ color: string | null; size: string | null }>({
    color: null,
    size: null,
  });

  const [variationPrice, setVariationPrice] = useState<string | null>(null);
  const [variationObj, setVariationObj] = useState<any | null>(null);

  const [currentUrl, setCurrentUrl] = useState<string>("");

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handleResolved = useCallback((variation: any, sel: any) => {
    const nextColor = sel?.color ?? null;
    const nextSize = sel?.size ?? null;

    setSelected({ color: nextColor, size: nextSize });
    setVariationObj(variation ?? null);
    setVariationPrice(variation?.price ?? null);
  }, []);

  const hasPickedAll = !isVariable || (!!selected.color && !!selected.size);
  const variationInStock = useMemo(
    () => getVariationInStock(variationObj),
    [variationObj]
  );

  const canOrder = useMemo(() => {
    if (!isVariable) return baseInStock;
    if (!hasPickedAll) return false;
    if (!variationObj) return false;
    return variationInStock === true;
  }, [isVariable, baseInStock, hasPickedAll, variationObj, variationInStock]);

  const badgeText = useMemo(() => {
    if (!isVariable) return baseInStock ? "Available" : "Unavailable";
    if (!hasPickedAll) return "Choose options";
    if (!variationObj) return "Choose options";
    return variationInStock === true ? "Available" : "Unavailable";
  }, [isVariable, baseInStock, hasPickedAll, variationObj, variationInStock]);

  const displayPrice = useMemo(() => {
    if (isVariable) {
      if (variationPrice && Number.isFinite(Number(variationPrice))) {
        return `৳ ${Number(variationPrice).toLocaleString("en-US")}`;
      }
      return basePriceLabel ? `From ${basePriceLabel}` : "Select options";
    }
    return basePriceLabel ?? "Price not set";
  }, [isVariable, variationPrice, basePriceLabel]);

  const waHref = useMemo(() => {
    const colorLabel = selected.color
      ? colorLabelMap.get(norm(selected.color)) || slugToLabel(selected.color)
      : null;

    const sizeLabel = selected.size
      ? sizeLabelMap.get(norm(selected.size)) || selected.size
      : null;

    const lines = [
      baseWaText,
      colorLabel ? `Color: ${colorLabel}` : null,
      sizeLabel ? `Size: ${sizeLabel}` : null,
      variationPrice ? `Price: ৳ ${Number(variationPrice).toLocaleString("en-US")}` : null,
      currentUrl ? `Link: ${currentUrl}` : null,
    ].filter(Boolean) as string[];

    return `${baseWaLink}?text=${encodeURIComponent(lines.join("\n"))}`;
  }, [
    baseWaLink,
    baseWaText,
    selected.color,
    selected.size,
    variationPrice,
    currentUrl,
    colorLabelMap,
    sizeLabelMap,
  ]);

  const ctaLabel = useMemo(() => {
    if (canOrder) return "Order on WhatsApp →";
    if (isVariable && !hasPickedAll) return "Select color & size";
    if (isVariable && hasPickedAll && !variationObj) return "Select valid combo";
    return "Unavailable";
  }, [canOrder, isVariable, hasPickedAll, variationObj]);

  const cartVariationData = useMemo(() => {
    const out: { key: string; value: string }[] = [];

    if (selected.color) {
      out.push({ key: "pa_color", value: selected.color });
    }

    if (selected.size) {
      out.push({ key: "pa_size", value: selected.size });
    }

    return out;
  }, [selected.color, selected.size]);

  const cartDisabled = useMemo(() => {
    if (!isVariable) return !baseInStock;
    return !canOrder;
  }, [isVariable, baseInStock, canOrder]);

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(0,0,0,0.05),transparent),radial-gradient(900px_500px_at_90%_0%,rgba(0,0,0,0.04),transparent),linear-gradient(to_bottom,#fcfcfd,#f7f7f9)] text-neutral-950 antialiased">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-[clamp(8px,3vw,20px)] pb-[120px] pt-[clamp(8px,3vw,24px)] sm:pb-16">
        <div className="mb-[clamp(10px,3vw,24px)] flex flex-col gap-2 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
          <Link
            href="/products"
            className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-full border border-black/8 bg-white/78 px-3 py-2 text-[clamp(11px,3vw,14px)] font-medium text-neutral-900 shadow-[0_10px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl transition duration-200 hover:bg-neutral-50 active:scale-[0.985] min-[360px]:w-auto"
          >
            <span className="text-base">←</span>
            Back
          </Link>

          <div className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-full border border-black/8 bg-white/78 px-3 py-2 text-[clamp(10px,2.8vw,13px)] font-medium text-neutral-700 shadow-[0_10px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl min-[360px]:w-auto">
            <span
              className={[
                "inline-block h-2 w-2 rounded-full shrink-0",
                badgeText === "Available" ? "bg-emerald-500" : "bg-rose-500",
              ].join(" ")}
            />
            <span className="truncate">{badgeText}</span>
          </div>
        </div>

        <div className="grid gap-[clamp(14px,4vw,40px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
          <section className="min-w-0">
            <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-black/8 bg-white/78 px-3 py-1.5 text-[clamp(10px,2.7vw,12px)] font-medium text-neutral-700 shadow-[0_10px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl">
              <span className="truncate">{category}</span>
            </div>

            <ProductGalleryClient images={images} title={product?.name} />

            <div className="mt-4 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:mt-5">
              <GlassStat label="Delivery" value="Cash on delivery" />
              <GlassStat label="Shipping" value="Dhaka + nationwide" />
            </div>

            <div className="mt-4 hidden lg:block">
              <OrderPolicySection items={orderPolicyItems} />
            </div>
          </section>

          <section className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[clamp(20px,5vw,28px)] border border-black/8 bg-white/80 p-[clamp(12px,4vw,28px)] shadow-[0_16px_40px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.74)] backdrop-blur-xl">
              <h1 className="text-[clamp(22px,6vw,36px)] font-semibold leading-[1.02] tracking-[-0.045em] text-neutral-950">
                {product?.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <InfoPill dark>{displayPrice}</InfoPill>
                <InfoPill>{isVariable ? "Choose color & size" : "Single item"}</InfoPill>
              </div>

              {isVariable ? (
                <div className="mt-5 rounded-[clamp(18px,4vw,24px)] border border-black/8 bg-white/72 p-[clamp(10px,3vw,16px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl">
                  <VariantSelectorClient
                    productId={Number(product?.id)}
                    colors={colors}
                    sizes={sizes}
                    onResolved={handleResolved}
                  />
                </div>
              ) : null}

              <div className="mt-6 hidden gap-3 sm:grid sm:grid-cols-1">
                <AddToCartButton
                  productId={Number(product?.id)}
                  quantity={1}
                  variationId={variationObj?.id ? Number(variationObj.id) : null}
                  variationData={cartVariationData}
                  disabled={cartDisabled}
                />

                <a
                  href={canOrder ? waHref : "#"}
                  onClick={(e) => {
                    if (!canOrder) e.preventDefault();
                  }}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!canOrder}
                  className={[
                    "inline-flex min-h-[48px] items-center justify-center rounded-[18px] px-5 py-3 text-sm font-semibold shadow-sm transition duration-200 active:scale-[0.985]",
                    canOrder
                      ? "bg-neutral-950 text-white hover:bg-neutral-800"
                      : "cursor-not-allowed bg-neutral-300 text-neutral-600",
                  ].join(" ")}
                >
                  {ctaLabel}
                </a>

                <a
                  href="#details"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-[18px] border border-black/8 bg-white/80 px-5 py-3 text-sm font-semibold text-neutral-900 shadow-[0_10px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl transition duration-200 hover:bg-neutral-50 active:scale-[0.985]"
                >
                  View details
                </a>
              </div>

              <div id="details" className="mt-7">
                <div className="text-[clamp(13px,3.2vw,15px)] font-semibold text-neutral-900">
                  Product details
                </div>

                <div className="mt-3 rounded-[clamp(16px,4vw,22px)] border border-black/8 bg-white/76 p-[clamp(10px,3vw,16px)] shadow-[0_10px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl">
                  <RichText html={product?.description || ""} />
                </div>
              </div>

              <div className="mt-6 rounded-[clamp(16px,4vw,22px)] border border-black/8 bg-neutral-50/85 p-[clamp(10px,3vw,16px)] text-[clamp(11px,2.9vw,13px)] leading-[1.55] text-neutral-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                Need help choosing size or color? Message us — we reply fast.
              </div>
            </div>

            <div className="mt-4 lg:hidden">
              <OrderPolicySection items={orderPolicyItems} compact />
            </div>
          </section>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/8 bg-white/82 backdrop-blur-2xl shadow-[0_-10px_24px_rgba(15,23,42,0.06)] sm:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-[clamp(8px,3vw,16px)] py-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[clamp(12px,3.3vw,14px)] font-semibold tracking-[-0.02em] text-neutral-900">
              {product?.name}
            </div>
            <div className="mt-0.5 text-[clamp(10px,2.7vw,12px)] text-neutral-600">
              {displayPrice} •{" "}
              {badgeText === "Available"
                ? "In stock"
                : badgeText === "Choose options"
                ? "Choose options"
                : "Unavailable"}
            </div>
          </div>

          <div className="w-[44%] min-w-[136px] shrink-0">
            <AddToCartButton
              productId={Number(product?.id)}
              quantity={1}
              variationId={variationObj?.id ? Number(variationObj.id) : null}
              variationData={cartVariationData}
              disabled={cartDisabled}
              className="min-h-[42px] rounded-[16px] px-4 py-3 text-[13px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}