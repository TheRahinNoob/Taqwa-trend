import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
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

function normalizeBaseUrl(url?: string | null) {
  if (!url) return "";
  return url.trim().replace(/\/+$/, "");
}

function getWooBaseUrl() {
  const candidates = [
    process.env.WC_BASE_URL,
    process.env.NEXT_PUBLIC_WORDPRESS_URL,
    process.env.WORDPRESS_URL,
  ];

  for (const value of candidates) {
    const normalized = normalizeBaseUrl(value);
    if (normalized) return normalized;
  }

  return "";
}

function formatMinorUnitAmount(value: unknown, minorUnit: number) {
  const raw = String(value ?? "").trim();

  if (!raw) return "0";
  if (!/^-?\d+$/.test(raw)) return raw;

  const negative = raw.startsWith("-");
  const digits = negative ? raw.slice(1) : raw;

  if (minorUnit <= 0) {
    return `${negative ? "-" : ""}${digits}`;
  }

  const padded = digits.padStart(minorUnit + 1, "0");
  const whole = padded.slice(0, -minorUnit);
  const fraction = padded.slice(-minorUnit);

  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

function getFirstImageSrc(item: any) {
  if (Array.isArray(item?.images) && item.images.length > 0) {
    return item.images[0]?.src ?? "";
  }
  return "";
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { orderId } = await context.params;
    const safeOrderId = Number(orderId);

    if (!Number.isFinite(safeOrderId) || safeOrderId <= 0) {
      return errorResponse("Invalid order ID.", 400);
    }

    const orderKey = request.nextUrl.searchParams.get("key")?.trim() || "";
    const billingEmail =
      request.nextUrl.searchParams.get("billing_email")?.trim() || "";

    if (!orderKey) {
      return errorResponse("Missing required order key.", 400);
    }

    const baseUrl = getWooBaseUrl();

    if (!baseUrl) {
      return errorResponse(
        "WooCommerce base URL is not configured. Set WC_BASE_URL or NEXT_PUBLIC_WORDPRESS_URL.",
        500
      );
    }

    const endpoint = new URL(
      `${baseUrl}/wp-json/wc/store/v1/order/${safeOrderId}`
    );
    endpoint.searchParams.set("key", orderKey);

    // Required for guest orders.
    if (billingEmail) {
      endpoint.searchParams.set("billing_email", billingEmail);
    }

    const upstreamResponse = await fetch(endpoint.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const contentType = upstreamResponse.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    let payload: any = null;

    if (isJson) {
      payload = await upstreamResponse.json();
    } else {
      const text = await upstreamResponse.text();
      payload = {
        message: text || "Unexpected non-JSON response from WooCommerce.",
      };
    }

    if (!upstreamResponse.ok) {
      return errorResponse(
        payload?.message || "Failed to load order details.",
        upstreamResponse.status,
        payload
      );
    }

    const order = payload;
    const minorUnit = Number(order?.totals?.currency_minor_unit ?? 2);

    const lineItems = Array.isArray(order?.items)
      ? order.items.map((item: any) => ({
          id: item?.id ?? null,
          product_id: item?.id ?? null,
          variation_id: null,
          name: item?.name ?? "Item",
          quantity: Number(item?.quantity || 1),
          total: formatMinorUnitAmount(item?.totals?.line_total, minorUnit),
          subtotal: formatMinorUnitAmount(
            item?.totals?.line_subtotal,
            minorUnit
          ),
          sku: item?.sku ?? "",
          image: getFirstImageSrc(item),
        }))
      : [];

    const responseBody = {
      ok: true,
      order: {
        id: order?.id ?? null,
        // Store API does not always return the classic REST fields below,
        // so keep safe fallbacks for frontend compatibility.
        number: order?.id ? String(order.id) : null,
        status: order?.status ?? null,
        order_key: orderKey,
        currency: order?.totals?.currency_code ?? null,
        payment_method: null,
        payment_method_title: null,
        date_created: null,
        total: formatMinorUnitAmount(order?.totals?.total_price, minorUnit),
        shipping_total: formatMinorUnitAmount(
          order?.totals?.total_shipping,
          minorUnit
        ),
        discount_total: formatMinorUnitAmount(
          order?.totals?.total_discount,
          minorUnit
        ),
        subtotal: formatMinorUnitAmount(order?.totals?.subtotal, minorUnit),
        billing: order?.billing_address ?? null,
        shipping: order?.shipping_address ?? null,
        customer_note: "",
        line_items: lineItems,
      },
    };

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error: any) {
    return errorResponse(error?.message || "Failed to load order", 500);
  }
}