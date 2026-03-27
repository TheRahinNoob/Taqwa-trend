import { NextRequest, NextResponse } from "next/server";
import {
  buildCartTokenCookie,
  clearCartTokenCookie,
  getCartTokenFromHeaders,
} from "@/lib/cart-token";
import { buildCheckoutState, buildCheckoutUpdateBody } from "@/lib/checkout";
import { getCart, getCheckout, updateCheckout } from "@/lib/woocommerce-store";
import type {
  CheckoutGetResponse,
  CheckoutUpdatePayload,
  CheckoutUpdateResponse,
} from "../../types/checkout";

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

function setCartTokenCookie(response: NextResponse, cartToken?: string | null) {
  if (cartToken) {
    response.headers.set("Set-Cookie", buildCartTokenCookie(cartToken));
  } else {
    response.headers.set("Set-Cookie", clearCartTokenCookie());
  }
}

function getItemsCount(cart: any): number {
  if (typeof cart?.items_count === "number") return cart.items_count;
  if (Array.isArray(cart?.items)) {
    return cart.items.reduce(
      (sum: number, item: { quantity?: number }) => sum + Number(item?.quantity || 0),
      0
    );
  }
  return 0;
}

export async function GET(request: NextRequest) {
  try {
    const incomingCartToken = getCartTokenFromHeaders(request.headers);

    const cartResult = await getCart(incomingCartToken);

    if (!cartResult.ok) {
      return errorResponse(cartResult.error, cartResult.status, cartResult.details);
    }

    const workingCartToken = cartResult.cartToken ?? incomingCartToken ?? null;
    const cartData = cartResult.data as any;
    const itemsCount = getItemsCount(cartData);

    // Important:
    // WooCommerce checkout creates/uses a draft order from the current cart.
    // If the cart is empty, calling /checkout can fail with:
    // "Cannot create order from empty cart."
    // So for an empty cart, we return a clean checkout state without calling /checkout.
    if (itemsCount < 1) {
      const checkoutState = buildCheckoutState({
        cart: cartData,
        draftOrder: null,
        customerNote: "",
        paymentMethod: "cod",
      });

      const responseBody: CheckoutGetResponse = {
        ok: true,
        cartToken: workingCartToken,
        checkout: checkoutState,
      };

      const response = NextResponse.json(responseBody);
      setCartTokenCookie(response, workingCartToken);
      return response;
    }

    const checkoutResult = await getCheckout(workingCartToken);

    if (!checkoutResult.ok) {
      return errorResponse(
        checkoutResult.error,
        checkoutResult.status,
        checkoutResult.details
      );
    }

    const draftOrder =
      checkoutResult.data && typeof checkoutResult.data === "object"
        ? (checkoutResult.data as Record<string, unknown>)
        : null;

    const checkoutState = buildCheckoutState({
      cart: cartData,
      draftOrder,
      customerNote:
        typeof (draftOrder as any)?.customer_note === "string"
          ? (draftOrder as any).customer_note
          : "",
      paymentMethod:
        typeof (draftOrder as any)?.payment_method === "string"
          ? (draftOrder as any).payment_method
          : "cod",
    });

    const responseBody: CheckoutGetResponse = {
      ok: true,
      cartToken: workingCartToken,
      checkout: checkoutState,
    };

    const response = NextResponse.json(responseBody);
    setCartTokenCookie(response, workingCartToken);

    return response;
  } catch (error: any) {
    return errorResponse(error?.message || "Failed to load checkout", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const incomingCartToken = getCartTokenFromHeaders(request.headers);

    const cartBootstrapResult = await getCart(incomingCartToken);

    if (!cartBootstrapResult.ok) {
      return errorResponse(
        cartBootstrapResult.error,
        cartBootstrapResult.status,
        cartBootstrapResult.details
      );
    }

    const workingCartToken = cartBootstrapResult.cartToken ?? incomingCartToken ?? null;
    const currentCart = cartBootstrapResult.data as any;
    const itemsCount = getItemsCount(currentCart);

    if (!workingCartToken) {
      return errorResponse("Could not initialize cart session for checkout.", 400);
    }

    if (itemsCount < 1) {
      const checkoutState = buildCheckoutState({
        cart: currentCart,
        draftOrder: null,
        customerNote: "",
        paymentMethod: "cod",
      });

      const responseBody: CheckoutUpdateResponse = {
        ok: true,
        cartToken: workingCartToken,
        checkout: checkoutState,
      };

      const response = NextResponse.json(responseBody);
      setCartTokenCookie(response, workingCartToken);
      return response;
    }

    const payload = (await request.json().catch(() => null)) as CheckoutUpdatePayload | null;

    if (!payload || typeof payload !== "object") {
      return errorResponse("Invalid checkout update payload.", 400);
    }

    const updateBody = buildCheckoutUpdateBody(payload);

    const checkoutUpdateResult = await updateCheckout(updateBody, workingCartToken, true);

    if (!checkoutUpdateResult.ok) {
      return errorResponse(
        checkoutUpdateResult.error,
        checkoutUpdateResult.status,
        checkoutUpdateResult.details
      );
    }

    const refreshedCartResult = await getCart(checkoutUpdateResult.cartToken ?? workingCartToken);

    if (!refreshedCartResult.ok) {
      return errorResponse(
        refreshedCartResult.error,
        refreshedCartResult.status,
        refreshedCartResult.details
      );
    }

    const nextCartToken =
      checkoutUpdateResult.cartToken ??
      refreshedCartResult.cartToken ??
      workingCartToken;

    const draftOrder =
      checkoutUpdateResult.data && typeof checkoutUpdateResult.data === "object"
        ? (checkoutUpdateResult.data as Record<string, unknown>)
        : null;

    const checkoutState = buildCheckoutState({
      cart: refreshedCartResult.data as any,
      draftOrder,
      customerNote:
        typeof (draftOrder as any)?.customer_note === "string"
          ? (draftOrder as any).customer_note
          : payload.customer_note ?? "",
      paymentMethod:
        typeof (draftOrder as any)?.payment_method === "string"
          ? (draftOrder as any).payment_method
          : payload.payment_method ?? "cod",
    });

    const responseBody: CheckoutUpdateResponse = {
      ok: true,
      cartToken: nextCartToken,
      checkout: checkoutState,
    };

    const response = NextResponse.json(responseBody);
    setCartTokenCookie(response, nextCartToken);

    return response;
  } catch (error: any) {
    return errorResponse(error?.message || "Failed to update checkout", 500);
  }
}