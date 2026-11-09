import { afterEach, describe, expect, it, vi } from "vitest";
import { money } from "@/lib/commerce/money";
import {
  authorize,
  isFakeAuthorizationId,
  SIMULATED_DELAY_MS,
  TEST_CARDS,
  validateCard,
} from "./fake-gateway";

const amount = money(19_760, "CHF");
const now = new Date("2026-11-09T12:00:00Z");
const pay = (cardNumber: string, expiry = "12/30", cvc = "123") =>
  authorize(cardNumber, expiry, cvc, amount, { delayMs: 0, now });

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("fake payment gateway", () => {
  it("approves the approved test card with a fake authorisation id", async () => {
    const result = await pay("4242 4242 4242 4242");
    expect(result).toMatchObject({ status: "approved", amount });
    expect(result.status === "approved" && isFakeAuthorizationId(result.authorizationId)).toBe(true);
  });

  it.each([
    ["4000 0000 0000 0002", "declined", /declined \(simulated\)/],
    ["4000000000009995", "declined", /insufficient funds/],
    ["4000-0000-0000-0119", "error", /did not respond/],
  ])("answers %s with %s", async (cardNumber, status, message) => {
    const result = await pay(cardNumber);
    expect(result.status).toBe(status);
    expect(result.status !== "approved" && result.message).toMatch(message);
  });

  it("rejects every number that is not a documented test card", async () => {
    const result = await pay("5555 5555 5555 4444");
    expect(result).toEqual({
      status: "declined",
      message:
        "This demo only accepts the test card numbers listed on this page. Never enter a real card number.",
    });
  });

  it("documents one test card per outcome", () => {
    expect(new Set(TEST_CARDS.map((card) => card.outcome))).toEqual(new Set(["approved", "declined", "error"]));
  });

  it("validates the expiry date and security code", () => {
    expect(validateCard({ cardNumber: "4242424242424242", expiry: "10/26", cvc: "12" }, now)).toEqual({
      expiry: "This expiry date is in the past.",
      cvc: "The security code is 3 digits.",
    });
    expect(validateCard({ cardNumber: "4242424242424242", expiry: "13/30", cvc: "123" }, now)).toEqual({
      expiry: "Use the format MM/YY, for example 12/30.",
    });
    expect(validateCard({ cardNumber: "4242424242424242", expiry: "11/26", cvc: "123" }, now)).toEqual({});
  });

  it("refuses an invalid amount", async () => {
    const result = await authorize("4242424242424242", "12/30", "123", money(0, "CHF"), { delayMs: 0, now });
    expect(result.status).toBe("error");
  });

  it("answers only after a short simulated delay", async () => {
    vi.useFakeTimers();
    let settled = false;
    const result = authorize("4242424242424242", "12/30", "123", amount, { now });
    void result.then(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(SIMULATED_DELAY_MS - 1);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toMatchObject({ status: "approved" });
    expect(settled).toBe(true);
  });

  it("never logs card details", async () => {
    const spies = (["log", "info", "warn", "error", "debug"] as const).map((method) => vi.spyOn(console, method));
    for (const card of TEST_CARDS) await pay(card.number);
    await pay("5555 5555 5555 4444");
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});
