import { NextRequest, NextResponse } from "next/server";
import { getIncomingCartToken, applyCartTokenCookie } from "@/lib/server-cart-token";
import { getCart } from "@/lib/woocommerce-store";

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

export async function GET(request: NextRequest) {
  try {
    const incomingCartToken = getIncomingCartToken(request);

    const cartResult = await getCart(incomingCartToken);

    if (!cartResult.ok) {
      return errorResponse(cartResult.error, cartResult.status, cartResult.details);
    }

    const nextCartToken = cartResult.cartToken ?? incomingCartToken ?? null;

    const response = NextResponse.json(cartResult.data, { status: 200 });
    applyCartTokenCookie(response, nextCartToken);

    return response;
  } catch (error: any) {
    return errorResponse(error?.message || "Failed to load cart", 500);
  }
}