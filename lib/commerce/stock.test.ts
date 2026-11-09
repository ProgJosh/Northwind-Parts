import { describe, expect, it } from "vitest";
import {
  LOW_STOCK_THRESHOLD,
  MAX_QUANTITY_PER_LINE,
  maxAddableQuantity,
  productStockStatus,
  quantityProblem,
  sellableQuantity,
  variantStockStatus,
} from "./stock";

const stock = (quantityAvailable: number | null, availableForSale = (quantityAvailable ?? 1) > 0) => ({
  availableForSale,
  quantityAvailable,
});

describe("stock rules", () => {
  it("never sells more than is in stock, or more than the per-order cap", () => {
    expect(sellableQuantity(stock(0))).toBe(0);
    expect(sellableQuantity(stock(3))).toBe(3);
    expect(sellableQuantity(stock(500))).toBe(MAX_QUANTITY_PER_LINE);
  });

  it("applies only the per-order cap when inventory is not tracked", () => {
    expect(sellableQuantity(stock(null))).toBe(MAX_QUANTITY_PER_LINE);
    expect(sellableQuantity(stock(null, false))).toBe(0);
  });

  it("subtracts what is already in the cart", () => {
    expect(maxAddableQuantity(stock(4), 3)).toBe(1);
    expect(maxAddableQuantity(stock(4), 4)).toBe(0);
    expect(maxAddableQuantity(stock(2), 5)).toBe(0);
  });

  it("labels variants in stock, low on stock, or sold out", () => {
    expect(variantStockStatus(stock(0))).toBe("sold-out");
    expect(variantStockStatus(stock(1))).toBe("low-stock");
    expect(variantStockStatus(stock(LOW_STOCK_THRESHOLD))).toBe("low-stock");
    expect(variantStockStatus(stock(LOW_STOCK_THRESHOLD + 1))).toBe("in-stock");
    expect(variantStockStatus(stock(null))).toBe("in-stock");
  });

  it("rolls variant stock up to the product", () => {
    expect(productStockStatus({ variants: [stock(0), stock(0)] })).toBe("sold-out");
    expect(productStockStatus({ variants: [stock(0), stock(2), stock(3)] })).toBe("low-stock");
    expect(productStockStatus({ variants: [stock(2), stock(30)] })).toBe("in-stock");
  });

  it("explains why a quantity is not allowed", () => {
    expect(quantityProblem(stock(0), "Floor Pump", 1)).toBe("Floor Pump is sold out.");
    expect(quantityProblem(stock(4), "Tyre (29 × 2.4)", 5)).toBe("Only 4 of Tyre (29 × 2.4) are available.");
    expect(quantityProblem(stock(1), "Rotor", 2)).toBe("Only 1 of Rotor is available.");
    expect(quantityProblem(stock(40), "Tube", 11)).toBe(
      `You can order up to ${MAX_QUANTITY_PER_LINE} of Tube per order.`,
    );
    expect(quantityProblem(stock(40), "Tube", 0)).toBe("Quantity must be at least 1.");
    expect(quantityProblem(stock(4), "Tyre", 4)).toBeNull();
  });
});
