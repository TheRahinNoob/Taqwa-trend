"use client";

import { useEffect, useRef, useState } from "react";

type VariationAttribute = {
  key: string;
  value: string;
};

type Props = {
  productId: number;
  quantity?: number;
  variationId?: number | null;
  variationData?: VariationAttribute[];
  disabled?: boolean;
  className?: string;
  onAdded?: (cart: any) => void;
};

function cleanVariationData(input: VariationAttribute[]) {
  return (Array.isArray(input) ? input : [])
    .map((item) => ({
      attribute: String(item?.key ?? "").trim(),
      value: String(item?.value ?? "").trim(),
    }))
    .filter((item) => item.attribute && item.value);
}

export default function AddToCartButton({
  productId,
  quantity = 1,
  variationId = null,
  variationData = [],
  disabled = false,
  className = "",
  onAdded,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const successTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  async function handleAddToCart() {
    if (disabled || loading) return;

    const safeProductId = Number(productId);
    const safeQuantity = Number(quantity);
    const cleanedVariation = cleanVariationData(variationData);

    if (!Number.isFinite(safeProductId) || safeProductId <= 0) {
      setError("Invalid product");
      return;
    }

    if (!Number.isFinite(safeQuantity) || safeQuantity <= 0) {
      setError("Invalid quantity");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }

    try {
      const payload: Record<string, unknown> = {
        id: safeProductId,
        quantity: safeQuantity,
      };

      // Important:
      // For WooCommerce variable products, send variation attributes array.
      // Example:
      // variation: [{ attribute: "pa_size", value: "m" }]
      if (cleanedVariation.length > 0) {
        payload.variation = cleanedVariation;
      }

      // Keep variationId only as extra metadata if you want it later,
      // but do not send it as the "variation" field because that breaks Store API format.
      if (variationId && Number.isFinite(Number(variationId))) {
        payload.variationId = Number(variationId);
      }

      const res = await fetch("/api/cart/add-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            data?.details?.message ||
            "Failed to add item to cart"
        );
      }

      setSuccess("Added to cart");
      onAdded?.(data);
      window.dispatchEvent(new Event("cart-updated"));

      successTimerRef.current = window.setTimeout(() => {
        setSuccess("");
      }, 1800);
    } catch (e: any) {
      setError(e?.message || "Failed to add item to cart");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        className={[
          "inline-flex w-full min-h-[48px] items-center justify-center rounded-[18px] px-5 py-3 text-sm font-semibold shadow-sm transition duration-200 active:scale-[0.985]",
          disabled || loading
            ? "cursor-not-allowed bg-neutral-300 text-neutral-600"
            : "bg-neutral-950 text-white hover:bg-neutral-800",
          className,
        ].join(" ")}
      >
        {loading ? "Adding..." : "Add to cart"}
      </button>

      {error ? (
        <div className="mt-2 text-xs font-medium text-rose-600">{error}</div>
      ) : null}

      {success ? (
        <div className="mt-2 text-xs font-medium text-emerald-600">
          {success}
        </div>
      ) : null}
    </div>
  );
}