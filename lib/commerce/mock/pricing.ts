import { formatMoney, money } from "../money";
import type { CartCost, DeliveryOption, Money } from "../types";

/**
 * Pricing rules of the mock store. Shopify computes these itself, so they
 * apply only to the mock backend.
 */

/** Swiss standard VAT (8.1 %) in basis points. Prices already include it. */
export const VAT_RATE_BASIS_POINTS = 810;

interface ShippingMethod {
  handle: string;
  title: string;
  description: string;
  priceMinor: number;
  /** Subtotal (minor units) from which this method is free, or null. */
  freeFromMinor: number | null;
}

export const SHIPPING_METHODS: readonly ShippingMethod[] = [
  { handle: "standard", title: "Standard post", description: "2–4 working days", priceMinor: 790, freeFromMinor: 12_000 },
  { handle: "express", title: "Express courier", description: "Next working day", priceMinor: 1_490, freeFromMinor: null },
];

export const DEFAULT_SHIPPING_HANDLE = "standard";

/** VAT contained in a VAT-inclusive amount, rounded to the nearest minor unit. */
export function includedVat(grossMinor: number, rateBasisPoints = VAT_RATE_BASIS_POINTS): number {
  return Math.round((grossMinor * rateBasisPoints) / (10_000 + rateBasisPoints));
}

export function deliveryOptionsFor(subtotal: Money): DeliveryOption[] {
  return SHIPPING_METHODS.map((method) => {
    const isFree = method.freeFromMinor !== null && subtotal.amountMinor >= method.freeFromMinor;
    const freeNote =
      method.freeFromMinor === null
        ? ""
        : ` · free from ${formatMoney(money(method.freeFromMinor, subtotal.currencyCode))}`;
    return {
      handle: method.handle,
      title: method.title,
      description: method.description + freeNote,
      estimatedCost: money(isFree ? 0 : method.priceMinor, subtotal.currencyCode),
    };
  });
}

/** Totals for a cart: VAT-inclusive prices, so tax is the share already inside the total. */
export function cartCost(subtotal: Money, delivery: DeliveryOption | null): CartCost {
  const { currencyCode } = subtotal;
  const shipping = delivery ? delivery.estimatedCost : null;
  const total = money(subtotal.amountMinor + (shipping?.amountMinor ?? 0), currencyCode);
  return {
    subtotalAmount: subtotal,
    shippingAmount: shipping,
    totalTaxAmount: money(includedVat(total.amountMinor), currencyCode),
    totalAmount: total,
    taxesIncluded: true,
  };
}
