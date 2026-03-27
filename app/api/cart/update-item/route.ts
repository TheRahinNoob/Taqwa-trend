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
    const quantity = Number(body?.quantity ?? 0);

    if (!key) return errorResponse("Missing cart item key.", 400);
    if (!Number.isFinite(quantity) || quantity < 1) {
      return errorResponse("Quantity must be at least 1.", 400);
    }

    const updateResult = await wcStoreFetch({
      method: "POST",
      path: "/cart/update-item",
      cartToken: incomingCartToken,
      body: { key, quantity },
    });

    if (!updateResult.ok) {
      return errorResponse(updateResult.error, updateResult.status, updateResult.details);
    }

    const refreshedCart = await getCart(updateResult.cartToken ?? incomingCartToken);

    if (!refreshedCart.ok) {
      return errorResponse(refreshedCart.error, refreshedCart.status, refreshedCart.details);
    }

    const nextCartToken =
      refreshedCart.cartToken ?? updateResult.cartToken ?? incomingCartToken ?? null;

    const response = NextResponse.json(refreshedCart.data);
    applyCartTokenCookie(response, nextCartToken);

    return response;
  } catch (error: any) {
    return errorResponse(error?.message || "Failed to update cart item", 500);
  }
}