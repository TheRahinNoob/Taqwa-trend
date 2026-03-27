import { NextRequest, NextResponse } from "next/server";
import {
  buildCartTokenCookie,
  clearCartTokenCookie,
  getCartTokenFromHeaders,
} from "@/lib/cart-token";

export function getIncomingCartToken(request: NextRequest): string | null {
  return getCartTokenFromHeaders(request.headers);
}

export function applyCartTokenCookie(
  response: NextResponse,
  cartToken?: string | null
) {
  if (cartToken) {
    response.headers.set("Set-Cookie", buildCartTokenCookie(cartToken));
  } else {
    response.headers.set("Set-Cookie", clearCartTokenCookie());
  }
}