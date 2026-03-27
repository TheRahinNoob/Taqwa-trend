import { NextRequest, NextResponse } from "next/server";
import { getIncomingCartToken, applyCartTokenCookie } from "@/lib/server-cart-token";
import { wcStoreFetch, getCart } from "@/lib/woocommerce-store";

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

export async function POST(request: NextRequest) {
  try {
    const incomingCartToken = getIncomingCartToken(request);
    const body = await request.json().catch(() => null);

    const key = String(body?.key ?? "").trim();
    if (!key) return errorResponse("Missing cart item key.", 400);

    const removeResult = await wcStoreFetch({
      method: "POST",
      path: "/cart/remove-item",
      cartToken: incomingCartToken,
      body: { key },
    });

    if (!removeResult.ok) {
      return errorResponse(removeResult.error, removeResult.status, removeResult.details);
    }

    const refreshedCart = await getCart(removeResult.cartToken ?? incomingCartToken);

    if (!refreshedCart.ok) {
      return errorResponse(refreshedCart.error, refreshedCart.status, refreshedCart.details);
    }

    const nextCartToken =
      refreshedCart.cartToken ?? removeResult.cartToken ?? incomingCartToken ?? null;

    const response = NextResponse.json(refreshedCart.data);
    applyCartTokenCookie(response, nextCartToken);

    return response;
  } catch (error: any) {
    return errorResponse(error?.message || "Failed to remove cart item", 500);
  }
}