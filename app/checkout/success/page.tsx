import { Suspense } from "react";
import CheckoutSuccessClient from "./CheckoutSuccessClient";

function CheckoutSuccessFallback() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#f4f5f7] text-neutral-950 antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#fbfbfc_0%,#f4f5f7_45%,#eef1f4_100%)]" />
        <div className="absolute left-[-8%] top-[-8%] h-[30rem] w-[30rem] rounded-full bg-white/80 blur-3xl" />
        <div className="absolute right-[-10%] top-[4%] h-[26rem] w-[26rem] rounded-full bg-white/70 blur-3xl" />
      </div>

      <main className="mx-auto w-full max-w-6xl px-3 pb-24 pt-4 sm:px-5 sm:pt-8 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 px-5 py-8 shadow-[0_12px_32px_rgba(15,23,42,0.06),0_2px_10px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-2xl sm:px-8 sm:py-10">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))]" />
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mx-auto h-20 w-20 animate-pulse rounded-[28px] bg-black/10" />
            <div className="mx-auto mt-6 h-6 w-32 animate-pulse rounded-full bg-black/10" />
            <div className="mx-auto mt-4 h-12 w-80 max-w-full animate-pulse rounded-2xl bg-black/10" />
            <div className="mx-auto mt-3 h-5 w-96 max-w-full animate-pulse rounded-xl bg-black/10" />
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06),0_2px_10px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-2xl">
            <div className="h-6 w-48 animate-pulse rounded-full bg-black/8" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-[20px] bg-black/8"
                />
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06),0_2px_10px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-2xl">
            <div className="h-6 w-32 animate-pulse rounded-full bg-black/8" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 animate-pulse rounded-full bg-black/8"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<CheckoutSuccessFallback />}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}