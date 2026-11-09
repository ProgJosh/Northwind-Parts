import { describe, expect, it } from "vitest";
import { decimalToMinorUnits, formatMoney, money, multiplyMoney, sumMoney } from "./money";

describe("money", () => {
  it("formats minor units with Intl.NumberFormat in Swiss style", () => {
    expect(formatMoney(money(4990, "CHF"))).toMatch(/^CHF\s49\.90$/);
    expect(formatMoney(money(123450, "CHF"))).toMatch(/^CHF\s1.234\.50$/);
    expect(formatMoney(money(0, "CHF"))).toMatch(/^CHF\s0\.00$/);
  });

  it("only accepts whole minor units", () => {
    expect(() => money(10.5, "CHF")).toThrow(RangeError);
  });

  it("adds and multiplies without floating-point drift", () => {
    const tenCents = money(10, "CHF");
    expect(sumMoney(Array.from({ length: 10 }, () => tenCents), "CHF")).toEqual(money(100, "CHF"));
    expect(multiplyMoney(money(1190, "CHF"), 3)).toEqual(money(3570, "CHF"));
  });

  it("refuses to add different currencies", () => {
    expect(() => sumMoney([money(100, "CHF"), money(100, "EUR")], "CHF")).toThrow(RangeError);
  });

  it("parses Shopify decimal strings into minor units exactly", () => {
    expect(decimalToMinorUnits("49.9", "CHF")).toBe(4990);
    expect(decimalToMinorUnits("49.90", "CHF")).toBe(4990);
    expect(decimalToMinorUnits("0.07", "CHF")).toBe(7);
    expect(decimalToMinorUnits("1000", "CHF")).toBe(100000);
    expect(decimalToMinorUnits("19.995", "CHF")).toBe(2000);
    expect(decimalToMinorUnits("1500", "JPY")).toBe(1500);
    expect(() => decimalToMinorUnits("12,50", "CHF")).toThrow(RangeError);
  });
});
