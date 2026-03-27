import { NextResponse } from "next/server";

function norm(x: unknown) {
  return String(x ?? "").trim().toLowerCase();
}

export async function GET() {
  /**
   * ✅ Canonical map: keys must match Woo "option" text.
   * From your variations: "Black", "Teal", "Brown", "Light Onion"
   */
  const canonical: Record<string, string> = {
    Black: "#111111",
    Teal: "#0f766e",
    Brown: "#7c4a2d",
    "Light Onion": "#612b44",
    Cream: "#ededa1",
    "Mauve Taupe": "#915f6d",
    Yellow: "#eeee22",
  };

  /**
   * ✅ Add normalized aliases so frontend can look up using:
   * - "Light Onion"
   * - "light onion"
   * - "LIGHT ONION"
   */
  const out: Record<string, string> = { ...canonical };
  for (const [k, v] of Object.entries(canonical)) {
    out[norm(k)] = v;
  }

  return NextResponse.json(out, {
    headers: {
      // optional: avoid stale map during dev
      "Cache-Control": "no-store",
    },
  });
}