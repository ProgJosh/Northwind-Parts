import { describe, expect, it } from "vitest";
import { money } from "../money";
import { cartCost, deliveryOptionsFor, includedVat } from "./pricing";

const chf = (amountMinor: number) => money(amountMinor, "CHF");

describe("cart totals (mock store pricing)", () => {
  it("works out the VAT already included in a price", () => {
    expect(includedVat(10_810)).toBe(810); // CHF 108.10 contains exactly CHF 8.10 at 8.1 %
    expect(includedVat(18_270)).toBe(1_369);
    expect(includedVat(0)).toBe(0);
  });

  it("makes standard post free from CHF 120.00", () => {
    const below = deliveryOptionsFor(chf(11_999));
    const atThreshold = deliveryOptionsFor(chf(12_000));
    expect(below.find((option) => option.handle === "standard")?.estimatedCost).toEqual(chf(790));
    expect(atThreshold.find((option) => option.handle === "standard")?.estimatedCost).toEqual(chf(0));
    expect(atThreshold.find((option) => option.handle === "express")?.estimatedCost).toEqual(chf(1_490));
  });

  it("adds shipping to the subtotal and reports the included VAT", () => {
    const standard = deliveryOptionsFor(chf(5_290))[0];
    expect(cartCost(chf(5_290), standard)).toEqual({
      subtotalAmount: chf(5_290),
      shippingAmount: chf(790),
      totalTaxAmount: chf(456),
      totalAmount: chf(6_080),
      taxesIncluded: true,
    });
  });

  it("has no shipping line without a delivery option", () => {
    const cost = cartCost(chf(0), null);
    expect(cost.shippingAmount).toBeNull();
    expect(cost.totalAmount).toEqual(chf(0));
  });
});
