import type { ProductVariant } from "./types";

/** A variant with this many units or fewer left shows "Low stock". */
export const LOW_STOCK_THRESHOLD = 5;

/** Store policy: the most units of one variant a shopper can buy per order. */
export const MAX_QUANTITY_PER_LINE = 10;

export type StockStatus = "in-stock" | "low-stock" | "sold-out";

type StockFields = Pick<ProductVariant, "availableForSale" | "quantityAvailable">;

/** The most units of this variant that can sit in one cart line. */
export function sellableQuantity(variant: StockFields): number {
  if (!variant.availableForSale) return 0;
  // Untracked inventory (null), or a backend that oversells (<= 0 but still for sale):
  // only the per-line cap applies.
  if (variant.quantityAvailable === null || variant.quantityAvailable <= 0) {
    return MAX_QUANTITY_PER_LINE;
  }
  return Math.min(variant.quantityAvailable, MAX_QUANTITY_PER_LINE);
}

/** How many more units can be added when `inCart` units are already in the cart. */
export function maxAddableQuantity(variant: StockFields, inCart: number): number {
  return Math.max(0, sellableQuantity(variant) - inCart);
}

export function variantStockStatus(variant: StockFields): StockStatus {
  if (!variant.availableForSale) return "sold-out";
  const left = variant.quantityAvailable;
  if (left !== null && left > 0 && left <= LOW_STOCK_THRESHOLD) return "low-stock";
  return "in-stock";
}

export function productStockStatus(product: { variants: readonly StockFields[] }): StockStatus {
  const forSale = product.variants.filter((variant) => variant.availableForSale);
  if (forSale.length === 0) return "sold-out";
  if (forSale.every((variant) => variantStockStatus(variant) === "low-stock")) return "low-stock";
  return "in-stock";
}

/**
 * Checks a requested line quantity against stock and store policy.
 * Returns a message for the shopper when the quantity is not allowed, otherwise null.
 */
export function quantityProblem(
  variant: StockFields,
  label: string,
  requested: number,
): string | null {
  if (!Number.isInteger(requested) || requested < 1) return "Quantity must be at least 1.";
  const limit = sellableQuantity(variant);
  if (limit === 0) return `${label} is sold out.`;
  if (requested <= limit) return null;
  if (limit < MAX_QUANTITY_PER_LINE) {
    return `Only ${limit} of ${label} ${limit === 1 ? "is" : "are"} available.`;
  }
  return `You can order up to ${MAX_QUANTITY_PER_LINE} of ${label} per order.`;
}
