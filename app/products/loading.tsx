export default function LoadingProducts() {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(0,0,0,0.06),transparent),radial-gradient(900px_500px_at_90%_0%,rgba(0,0,0,0.05),transparent)]">
      {/* Header placeholder */}
      <div className="sticky top-0 z-30 border-b border-black/10 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="h-9 w-36 animate-pulse rounded-2xl bg-black/10" />
            <div className="h-9 w-24 animate-pulse rounded-2xl bg-black/10" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-10">
        {/* Premium filter bar skeleton */}
        <div className="sticky top-3 z-20">
          <div className="rounded-3xl border border-black/10 bg-white/75 p-3 shadow-sm backdrop-blur sm:p-4">
            {/* search + filters row */}
            <div className="flex items-center gap-2">
              <div className="h-11 flex-1 animate-pulse rounded-2xl bg-black/10" />
              <div className="h-11 w-28 animate-pulse rounded-2xl bg-black/10" />
            </div>

            {/* category chips row */}
            <div className="mt-3 flex gap-2 overflow-hidden">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-black/10"
                />
              ))}
            </div>

            {/* desktop extra row placeholder */}
            <div className="mt-3 hidden gap-3 sm:flex">
              <div className="h-11 flex-1 animate-pulse rounded-2xl bg-black/10" />
              <div className="h-11 flex-1 animate-pulse rounded-2xl bg-black/10" />
              <div className="h-11 w-[210px] animate-pulse rounded-2xl bg-black/10" />
              <div className="h-11 w-24 animate-pulse rounded-2xl bg-black/10" />
            </div>
          </div>
        </div>

        {/* count line skeleton */}
        <div className="mt-4 h-5 w-56 animate-pulse rounded-xl bg-black/10" />

        {/* product grid skeleton */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"
            >
              <div className="aspect-[4/5] animate-pulse bg-black/10" />
              <div className="p-3">
                <div className="h-4 w-4/5 animate-pulse rounded bg-black/10" />
                <div className="mt-2 h-4 w-2/5 animate-pulse rounded bg-black/10" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}