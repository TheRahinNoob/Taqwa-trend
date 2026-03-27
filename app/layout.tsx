import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Taqwa Trend",
  description: "Premium modestwear for graceful everyday style.",
};

function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/8 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="max-w-md">
          <div className="text-[15px] font-semibold tracking-[-0.02em] text-neutral-950">
            Taqwa Trend
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Premium modestwear with a refined, modern shopping experience.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-neutral-600">
          <Link href="/" className="transition hover:text-neutral-950">
            Home
          </Link>
          <Link href="/products" className="transition hover:text-neutral-950">
            Shop
          </Link>
          <a href="#" className="transition hover:text-neutral-950">
            WhatsApp
          </a>
          <a href="#" className="transition hover:text-neutral-950">
            Facebook
          </a>
        </div>
      </div>

      <div className="border-t border-black/6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <div>© {year} Taqwa Trend. All rights reserved.</div>
          <div>Designed for a smooth, elegant shopping experience.</div>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#fcfcfd] text-neutral-950`}
      >
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}