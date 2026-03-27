import { NextResponse } from "next/server";

function normalizeBaseUrl(input: string) {
  let base = String(input || "").trim();
  if (base && !/^https?:\/\//i.test(base)) base = `https://${base}`;
  base = base.replace(/\/+$/, "");
  return base;
}

export async function GET(req: Request) {
  const baseRaw = process.env.WC_BASE_URL || process.env.WC_API_URL;
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;

  const base = baseRaw ? normalizeBaseUrl(baseRaw) : "";
  if (!base || !key || !secret) {
    return NextResponse.json({ error: "Missing Woo env vars" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const categoryId = Number(searchParams.get("categoryId"));
  const excludeId = Number(searchParams.get("excludeId"));
  const limit = Math.min(12, Math.max(1, Number(searchParams.get("limit") ?? 8)));

  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    return NextResponse.json({ error: "Missing/invalid categoryId" }, { status: 400 });
  }

  const url = new URL("/wp-json/wc/v3/products", base);
  url.searchParams.set("status", "publish");
  url.searchParams.set("per_page", String(limit));
  url.searchParams.set("category", String(categoryId));
  url.searchParams.set("orderby", "date");
  url.searchParams.set("order", "desc");
  if (Number.isFinite(excludeId) && excludeId > 0) url.searchParams.set("exclude", String(excludeId));

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return NextResponse.json(
      { error: data?.message || "Woo request failed", details: data },
      { status: res.status }
    );
  }

  return NextResponse.json(Array.isArray(data) ? data : [], { status: 200 });
}