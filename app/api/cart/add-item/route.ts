import { NextRequest, NextResponse } from "next/server";
import { getIncomingCartToken, applyCartTokenCookie } from "@/lib/server-cart-token";
import { wcStoreFetch, getCart } from "@/lib/woocommerce-store";

type VariationAttribute = {
  attribute?: string;
  value?: string;
};

function errorResponse(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      details: details ?? null,
    },
    { status }
  );
}

function normalizeVariationArray(input: unknown): VariationAttribute[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      const attribute = String((item as any)?.attribute ?? (item as any)?.key ?? "").trim();
      const value = String((item as any)?.value ?? "").trim();

      if (!attribute || !value) return null;

      return { attribute, value };
    })
    .filter(Boolean) as VariationAttribute[];
}

export async function POST(request: NextRequest) {
  try {
    const incomingCartToken = getIncomingCartToken(request);
    const body = await request.json().catch(() => null);

    const productId = Number(body?.id ?? body?.productId ?? 0);
    const quantity = Number(body?.quantity ?? 1);

    if (!Number.isFinite(productId) || productId < 1) {
      return errorResponse("Missing valid product ID.", 400);
    }

    const variation = normalizeVariationArray(body?.variation ?? body?.variationData);

    const addPayload: Record<string, unknown> = {
      id: productId,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    };

    // Important:
    // For variable products WooCommerce Store API expects:
    // variation: [{ attribute: "...", value: "..." }]
    if (variation.length > 0) {
      addPayload.variation = variation;
    }

    const addResult = await wcStoreFetch({
      method: "POST",
      path: "/cart/add-item",
      cartToken: incomingCartToken,
      body: addPayload,
    });

    if (!addResult.ok) {
      return errorResponse(addResult.error, addResult.status, addResult.details);
    }

    const refreshedCart = await getCart(addResult.cartToken ?? incomingCartToken);

    if (!refreshedCart.ok) {
      return errorResponse(refreshedCart.error, refreshedCart.status, refreshedCart.details);
    }

    const nextCartToken =
      refreshedCart.cartToken ?? addResult.cartToken ?? incomingCartToken ?? null;

    const response = NextResponse.json(refreshedCart.data, { status: 200 });
    applyCartTokenCookie(response, nextCartToken);

    return response;
  } catch (error: any) {
    return errorResponse(error?.message || "Failed to add item to cart", 500);
  }
}