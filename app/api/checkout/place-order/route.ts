import { NextRequest, NextResponse } from "next/server";
import { getCartTokenFromHeaders } from "@/lib/cart-token";
import { buildPlaceOrderBody } from "@/lib/checkout";
import { getCart, placeOrder } from "@/lib/woocommerce-store";
import { applyCartTokenCookie } from "@/lib/server-cart-token";
import type { PlaceOrderPayload, PlaceOrderResponse } from "../../../types/checkout";

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

function getItemsCount(cart: any): number {
  if (typeof cart?.items_count === "number") return cart.items_count;
  if (Array.isArray(cart?.items)) {
    return cart.items.reduce(
      (sum: number, item: { quantity?: number }) =>
        sum + Number(item?.quantity || 0),
      0
    );
  }
  return 0;
}

function validatePlaceOrderPayload(payload: PlaceOrderPayload | null): string | null {
  if (!payload || typeof payload !== "object") return "Invalid checkout payload.";
  if (!payload.billing_address) return "Billing address is required.";
  if (!payload.shipping_address) return "Shipping address is required.";
  if (!payload.payment_method || typeof payload.payment_method !== "string") {
    return "Payment method is required.";
  }

  if (!payload.billing_address.first_name?.trim()) return "First name is required.";
  if (!payload.billing_address.last_name?.trim()) return "Last name is required.";
  if (!payload.billing_address.address_1?.trim()) return "Address is required.";
  if (!payload.billing_address.city?.trim()) return "City is required.";
  if (!payload.billing_address.country?.trim()) return "Country is required.";
  if (!payload.billing_address.phone?.trim()) return "Phone number is required.";
  if (!payload.billing_address.email?.trim()) return "Email is required.";

  return null;
}

export async function POST(request: NextRequest) {
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

    const currentCart = cartBootstrapResult.data as any;
    const itemsCount = getItemsCount(currentCart);
    const workingCartToken =
      cartBootstrapResult.cartToken ?? incomingCartToken ?? null;

    if (!workingCartToken) {
      return errorResponse("Could not initialize cart session for order placement.", 400);
    }

    if (itemsCount < 1) {
      return errorResponse("Your cart is empty.", 400);
    }

    const payload = (await request.json().catch(() => null)) as PlaceOrderPayload | null;
    const validationError = validatePlaceOrderPayload(payload);

    if (validationError) {
      return errorResponse(validationError, 400);
    }

    const placeOrderBody = buildPlaceOrderBody(payload!);
    const orderResult = await placeOrder(placeOrderBody, workingCartToken);

    if (!orderResult.ok) {
      return errorResponse(orderResult.error, orderResult.status, orderResult.details);
    }

    const raw = orderResult.data as Record<string, any>;
    const nextCartToken = orderResult.cartToken ?? null;

    const orderId = raw?.order_id ?? raw?.id ?? null;
    const orderKey = raw?.order_key ?? null;
    const billingEmail = String(
      payload?.billing_address?.email ??
        raw?.billing_address?.email ??
        raw?.billing_address?.email_address ??
        ""
    ).trim();

    const params = new URLSearchParams();

    if (orderId) {
      params.set("orderId", String(orderId));
    }

    if (orderKey) {
      params.set("key", String(orderKey));
    }

    if (billingEmail) {
      params.set("billing_email", billingEmail);
    }

    const redirectUrl = orderId
      ? `/checkout/success?${params.toString()}`
      : "/checkout/success";

    const responseBody: PlaceOrderResponse = {
      ok: true,
      orderId,
      orderKey,
      status: raw?.status ?? raw?.payment_result?.payment_status ?? "pending",
      redirectUrl,
      message:
        raw?.payment_result?.payment_details?.[0]?.value ??
        raw?.message ??
        "Order placed successfully.",
      raw,
    };

    const response = NextResponse.json(responseBody, { status: 200 });
    applyCartTokenCookie(response, nextCartToken);

    return response;
  } catch (error: any) {
    return errorResponse(error?.message || "Failed to place order", 500);
  }
}