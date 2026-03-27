import Link from "next/link";

type WCImage = {
  src?: string;
  alt?: string;
};

type WCCategory = {
  id?: number;
  name?: string;
  slug?: string;
};

export type WCProductLite = {
  id: number;
  name: string;
  slug: string;
  price: string;
  images?: WCImage[];
  categories?: WCCategory[];
};

function formatBDT(price: string) {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `৳ ${n.toLocaleString("en-US")}`;
}

function safeText(x: unknown) {
  return String(x ?? "").replace(/\s+/g, " ").trim();
}

export default function ProductCard({ p }: { p: WCProductLite }) {
  const name = safeText(p?.name) || "Untitled product";
  const slug = safeText(p?.slug);
  const img = safeText(p?.images?.[0]?.src);
  const imgAlt = safeText(p?.images?.[0]?.alt) || name;

  const category = safeText(p?.categories?.[0]?.name) || "Collection";
  const priceLabel = formatBDT(safeText(p?.price));

  if (!slug) return null;

  return (
    <Link
      href={`/products/${slug}`}
      aria-label={`View product: ${name}`}
      className={[
        "group relative block min-w-0 overflow-hidden",
        "rounded-[clamp(16px,4.5vw,24px)]",
        "border border-white/70 bg-white/72 backdrop-blur-2xl",
        "shadow-[0_1px_0_rgba(255,255,255,0.82),0_10px_30px_rgba(15,23,42,0.07),0_2px_8px_rgba(15,23,42,0.04)]",
        "transition duration-300",
        "active:scale-[0.985]",
        "hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(255,255,255,0.9),0_18px_42px_rgba(15,23,42,0.09),0_3px_10px_rgba(15,23,42,0.05)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-white to-transparent" />

      <div className="pointer-events-none absolute inset-0 z-0 opacity-70">
        <div className="absolute left-[-18%] top-0 h-[clamp(40px,18vw,80px)] w-[clamp(40px,18vw,80px)] rounded-full bg-white/50 blur-2xl" />
        <div className="absolute bottom-[12%] right-[-18%] h-[clamp(40px,18vw,80px)] w-[clamp(40px,18vw,80px)] rounded-full bg-white/35 blur-3xl" />
      </div>

      <div
        className={[
          "relative z-[1] overflow-hidden",
          "aspect-[0.78/1]",
          "min-h-[clamp(150px,58vw,240px)]",
          "rounded-[clamp(14px,4vw,22px)]",
          "bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]",
        ].join(" ")}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={imgAlt}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.95),transparent_22%),radial-gradient(circle_at_76%_80%,rgba(255,255,255,0.45),transparent_24%),linear-gradient(135deg,#e5e7eb_0%,#f8fafc_50%,#e2e8f0_100%)]" />
        )}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.22),rgba(255,255,255,0.06)_18%,rgba(0,0,0,0.00)_42%,rgba(0,0,0,0.18)_76%,rgba(0,0,0,0.34)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(255,255,255,0.28),transparent_18%),radial-gradient(circle_at_82%_16%,rgba(255,255,255,0.12),transparent_16%)]" />

        <div className="absolute left-[clamp(6px,2.2vw,12px)] top-[clamp(6px,2.2vw,12px)] max-w-[calc(100%-12px)]">
          <div
            className={[
              "inline-flex max-w-full min-w-0 items-center",
              "gap-[clamp(4px,1.5vw,8px)] rounded-full",
              "border border-white/55 bg-white/68 backdrop-blur-2xl",
              "px-[clamp(6px,2.4vw,12px)] py-[clamp(4px,1.4vw,6px)]",
              "text-[clamp(7px,2.3vw,11px)] font-semibold uppercase tracking-[0.12em] text-neutral-900/88",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_6px_20px_rgba(15,23,42,0.07)]",
            ].join(" ")}
          >
            <span className="inline-block h-[clamp(4px,1.2vw,6px)] w-[clamp(4px,1.2vw,6px)] shrink-0 rounded-full bg-neutral-900/65" />
            <span className="truncate">{category}</span>
          </div>
        </div>

        <div className="absolute bottom-[clamp(6px,2.2vw,12px)] left-[clamp(6px,2.2vw,12px)] right-[clamp(6px,2.2vw,12px)]">
          <div
            className={[
              "relative overflow-hidden",
              "rounded-[clamp(12px,3.8vw,18px)] border border-white/45 bg-white/48",
              "px-[clamp(7px,2.6vw,14px)] py-[clamp(7px,2.3vw,12px)]",
              "backdrop-blur-2xl",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_24px_rgba(15,23,42,0.10)]",
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.34),rgba(255,255,255,0.10)_35%,rgba(255,255,255,0.04))]" />

            <div className="relative flex min-w-0 items-center justify-between gap-[clamp(6px,2vw,12px)]">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[clamp(7px,2.2vw,10px)] font-medium uppercase tracking-[0.14em] text-neutral-700/65">
                  Explore
                </div>
                <div className="truncate text-[clamp(10px,3.2vw,13px)] font-semibold tracking-[-0.015em] text-neutral-900">
                  View details
                </div>
              </div>

              <div
                className={[
                  "grid shrink-0 place-items-center rounded-full",
                  "h-[clamp(22px,7.6vw,36px)] w-[clamp(22px,7.6vw,36px)]",
                  "border border-white/55 bg-white/55",
                  "text-[clamp(9px,2.8vw,13px)] text-neutral-900",
                  "backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition",
                  "group-hover:translate-x-[1px] group-hover:bg-white/70",
                ].join(" ")}
              >
                →
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-[1] px-[clamp(8px,2.8vw,16px)] pb-[clamp(8px,2.8vw,16px)] pt-[clamp(8px,2.8vw,14px)]">
        <div className="flex min-w-0 items-start gap-[clamp(6px,2vw,12px)]">
          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 break-words text-[clamp(11px,3.6vw,15px)] font-semibold leading-[1.16] tracking-[-0.025em] text-neutral-950">
              {name}
            </div>

            <div className="mt-[clamp(5px,1.8vw,8px)] flex flex-wrap items-center gap-[clamp(4px,1.6vw,8px)]">
              <div
                className={[
                  "inline-flex min-h-[clamp(24px,7vw,30px)] max-w-full items-center rounded-full",
                  "border border-black/6 bg-neutral-950/[0.035]",
                  "px-[clamp(7px,2.2vw,12px)] py-[clamp(5px,1.6vw,6px)]",
                  "text-[clamp(9px,2.7vw,12px)] font-semibold text-neutral-900",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
                ].join(" ")}
              >
                <span className="truncate">{priceLabel ?? "Select options"}</span>
              </div>

              <div className="h-1 w-1 shrink-0 rounded-full bg-neutral-400/70" />

              <div className="min-w-0 truncate text-[clamp(9px,2.7vw,12px)] text-neutral-600">
                Tap to order
              </div>
            </div>
          </div>

          <div className="mt-0.5 hidden shrink-0 md:block">
            <div
              className={[
                "grid h-9 w-9 place-items-center rounded-full",
                "border border-black/8 bg-white/82 text-sm text-neutral-900",
                "shadow-[0_6px_18px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.85)]",
                "backdrop-blur-xl transition group-hover:bg-white",
              ].join(" ")}
            >
              ↗
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-[clamp(8px,2.8vw,16px)] right-[clamp(8px,2.8vw,16px)] h-px bg-gradient-to-r from-transparent via-black/8 to-transparent" />
    </Link>
  );
}