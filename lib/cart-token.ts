const CART_TOKEN_HEADER = "Cart-Token";
const CART_TOKEN_COOKIE = "cart_token";

export function getCartTokenFromHeaders(headers: Headers): string | null {
  const direct = headers.get(CART_TOKEN_HEADER);
  if (direct && direct.trim()) return direct.trim();

  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((part) => {
      const [rawKey, ...rest] = part.trim().split("=");
      return [rawKey, decodeURIComponent(rest.join("=") || "")];
    })
  );

  const cookieValue = cookies[CART_TOKEN_COOKIE];
  return cookieValue?.trim() ? cookieValue.trim() : null;
}

export function applyCartToken(headers: Headers, cartToken?: string | null) {
  if (cartToken?.trim()) {
    headers.set(CART_TOKEN_HEADER, cartToken.trim());
  }
}

export function getCartTokenFromResponseHeaders(headers: Headers): string | null {
  const token = headers.get(CART_TOKEN_HEADER);
  return token?.trim() ? token.trim() : null;
}

export function buildCartTokenCookie(cartToken: string) {
  const encoded = encodeURIComponent(cartToken);

  return [
    `${CART_TOKEN_COOKIE}=${encoded}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : "",
    // 30 days
    `Max-Age=${60 * 60 * 24 * 30}`,
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearCartTokenCookie() {
  return [
    `${CART_TOKEN_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : "",
    "Max-Age=0",
  ]
    .filter(Boolean)
    .join("; ");
}

export const cartToken = {
  header: CART_TOKEN_HEADER,
  cookie: CART_TOKEN_COOKIE,
};