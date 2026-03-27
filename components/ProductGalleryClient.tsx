"use client";

import { useMemo, useState } from "react";

type Img = { src: string; alt?: string };

export default function ProductGalleryClient({
  images,
  title,
}: {
  images: Img[];
  title: string;
}) {
  const safe = useMemo(() => (Array.isArray(images) ? images : []), [images]);
  const [active, setActive] = useState(0);

  const current = safe[active]?.src;

  return (
    <div className="w-full">
      {/* Main */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_30%_20%,rgba(0,0,0,0.07),transparent)]" />
        <div className="relative aspect-[4/5] w-full bg-neutral-50 sm:aspect-[16/15]">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current}
              alt={title}
              className="h-full w-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-neutral-100 to-neutral-200" />
          )}
        </div>
      </div>

      {/* Thumbs */}
      {safe.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {safe.map((im, i) => (
            <button
              key={im.src + i}
              type="button"
              onClick={() => setActive(i)}
              className={[
                "relative shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition",
                i === active
                  ? "border-neutral-900/40 ring-2 ring-neutral-900/10"
                  : "border-black/10 hover:border-black/20",
              ].join(" ")}
              aria-label={`View image ${i + 1}`}
            >
              <div className="h-20 w-16 bg-neutral-50 sm:h-24 sm:w-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={im.src}
                  alt={im.alt || title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}