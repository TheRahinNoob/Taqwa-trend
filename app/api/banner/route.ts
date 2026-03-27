import { NextResponse } from "next/server";

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

function normalizeFrontendUrl(url?: string | null) {
  const raw = String(url ?? "").trim();
  if (!raw) return "";

  const siteBase = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(
    /\/+$/,
    ""
  );

  if (!siteBase) return raw;

  const localBases = [
    "http://localhost:3000",
    "https://localhost:3000",
    "http://127.0.0.1:3000",
    "https://127.0.0.1:3000",
    "http://192.168.0.105:3000",
    "https://192.168.0.105:3000",
  ];

  for (const localBase of localBases) {
    if (raw.startsWith(localBase)) {
      return `${siteBase}${raw.slice(localBase.length)}`;
    }
  }

  return raw;
}

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  return { res, data };
}

async function resolveMediaUrl(base: string, value: unknown): Promise<string> {
  if (typeof value === "string" && /^https?:\/\//i.test(value)) {
    return normalizePublicWpUrl(value);
  }

  const id =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
      ? Number(value)
      : null;

  if (!id || !Number.isFinite(id)) return "";

  const { res, data } = await fetchJson(`${base}/wp-json/wp/v2/media/${id}`);
  if (!res.ok || !data) return "";

  return normalizePublicWpUrl(String(data?.source_url ?? ""));
}

function toTermId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && /^\d+$/.test(value)) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  if (value && typeof value === "object") {
    const maybeId = (value as any).term_id ?? (value as any).id;
    if (typeof maybeId === "number" && Number.isFinite(maybeId)) return maybeId;
    if (typeof maybeId === "string" && /^\d+$/.test(maybeId)) {
      const n = Number(maybeId);
      return Number.isFinite(n) ? n : null;
    }
  }

  return null;
}

function cleanCategoryIds(values: unknown[]) {
  const out: number[] = [];
  const seen = new Set<number>();

  for (const v of values) {
    const id = toTermId(v);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }

  return out;
}

export async function GET() {
  const baseRaw = process.env.WC_BASE_URL || process.env.WC_API_URL;
  const base = baseRaw ? normalizeBaseUrl(baseRaw) : "";

  if (!base) {
    return NextResponse.json(
      { error: "Missing WC_BASE_URL or WC_API_URL" },
      { status: 500 }
    );
  }

  try {
    const { res, data } = await fetchJson(`${base}/wp-json/wp/v2/pages/2`);

    if (!res.ok || !data) {
      return NextResponse.json(
        {
          error: "Failed to fetch homepage banner page",
          status: res.status,
          details: data,
        },
        { status: res.status || 500 }
      );
    }

    const acf = data?.acf ?? {};

    const desktop = await resolveMediaUrl(base, acf.banner_desktop);
    const tablet = await resolveMediaUrl(base, acf.banner_tablet);
    const mobile = await resolveMediaUrl(base, acf.banner_mobile);

    const featuredCategoryIds = cleanCategoryIds([
      acf.home_category_1,
      acf.home_category_2,
      acf.home_category_3,
      acf.home_category_4,
    ]);

    return NextResponse.json({
      desktop,
      tablet,
      mobile,
      title: String(acf.banner_title ?? ""),
      subtitle: String(acf.banner_subtitle ?? ""),
      buttonText: String(acf.banner_button_text ?? ""),
      buttonLink: normalizeFrontendUrl(String(acf.banner_button_link ?? "")),
      featuredCategoryIds,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch banner",
        message: e?.message || String(e),
      },
      { status: 500 }
    );
  }
}