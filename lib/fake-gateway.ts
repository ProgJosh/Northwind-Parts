/**
 * FAKE PAYMENT GATEWAY. Demo only, no real payments.
 *
 * - Runs entirely in the browser. Card details are never sent anywhere,
 *   stored, or logged, and nothing is ever charged.
 * - Only the test card numbers in TEST_CARDS are accepted. Every other number
 *   is rejected with a clear message before any "payment" happens.
 */
import { randomId } from "@/lib/commerce/ids";
import type { Money } from "@/lib/commerce/types";

type GatewayOutcome = "approved" | "declined" | "error";

export interface TestCard {
  number: string;
  outcome: GatewayOutcome;
  label: string;
  /** What happens when this card is used, for the test-card table. */
  result: string;
  /** Message shown to the shopper when the card is not approved. */
  message: string;
}

export const TEST_CARDS: readonly TestCard[] = [
  {
    number: "4242 4242 4242 4242",
    outcome: "approved",
    label: "Approved",
    result: "Payment is approved and the order is placed.",
    message: "",
  },
  {
    number: "4000 0000 0000 0002",
    outcome: "declined",
    label: "Declined",
    result: "The card is declined.",
    message: "Your card was declined (simulated). Try another test card.",
  },
  {
    number: "4000 0000 0000 9995",
    outcome: "declined",
    label: "Insufficient funds",
    result: "The card is declined for insufficient funds.",
    message: "Your card was declined for insufficient funds (simulated). Try another test card.",
  },
  {
    number: "4000 0000 0000 0119",
    outcome: "error",
    label: "Gateway error",
    result: "The gateway does not respond. Nothing is charged.",
    message: "The payment gateway did not respond (simulated). Nothing was charged. Please try again.",
  },
];

/** How long the fake gateway "thinks" before answering. */
export const SIMULATED_DELAY_MS = 900;

export type AuthorizeResult =
  | { status: "approved"; authorizationId: string; amount: Money }
  | { status: "declined"; message: string }
  | { status: "error"; message: string };

export interface CardDetails {
  cardNumber: string;
  expiry: string;
  cvc: string;
}

export type CardErrors = Partial<Record<keyof CardDetails, string>>;

function normalizeCardNumber(value: string): string {
  return value.replace(/[\s-]/g, "");
}

function findTestCard(cardNumber: string): TestCard | undefined {
  const digits = normalizeCardNumber(cardNumber);
  return TEST_CARDS.find((card) => normalizeCardNumber(card.number) === digits);
}

function parseExpiry(value: string): { month: number; year: number } | null {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const month = Number(match[1]);
  if (month < 1 || month > 12) return null;
  return { month, year: 2000 + Number(match[2]) };
}

/** Field-level checks for the payment form. Non-test card numbers always fail. */
export function validateCard(details: CardDetails, now: Date = new Date()): CardErrors {
  const errors: CardErrors = {};

  if (normalizeCardNumber(details.cardNumber) === "") {
    errors.cardNumber = "Enter one of the test card numbers.";
  } else if (!findTestCard(details.cardNumber)) {
    errors.cardNumber =
      "This demo only accepts the test card numbers listed on this page. Never enter a real card number.";
  }

  const expiry = parseExpiry(details.expiry);
  if (details.expiry.trim() === "") {
    errors.expiry = "Enter an expiry date.";
  } else if (!expiry) {
    errors.expiry = "Use the format MM/YY, for example 12/30.";
  } else {
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth() + 1;
    if (expiry.year < thisYear || (expiry.year === thisYear && expiry.month < thisMonth)) {
      errors.expiry = "This expiry date is in the past.";
    }
  }

  const cvc = details.cvc.trim();
  if (cvc === "") errors.cvc = "Enter the 3-digit security code.";
  else if (!/^\d{3}$/.test(cvc)) errors.cvc = "The security code is 3 digits.";

  return errors;
}

/**
 * Pretends to authorise `amount` on a test card, after a short delay.
 * The card details are only compared with TEST_CARDS: never stored, logged, or sent.
 */
export async function authorize(
  cardNumber: string,
  expiry: string,
  cvc: string,
  amount: Money,
  options: { delayMs?: number; now?: Date } = {},
): Promise<AuthorizeResult> {
  await new Promise((resolve) => setTimeout(resolve, options.delayMs ?? SIMULATED_DELAY_MS));

  if (!Number.isSafeInteger(amount.amountMinor) || amount.amountMinor <= 0) {
    return { status: "error", message: "The payment amount is invalid. Nothing was charged." };
  }

  const errors = validateCard({ cardNumber, expiry, cvc }, options.now);
  const card = findTestCard(cardNumber);
  if (!card || Object.keys(errors).length > 0) {
    return {
      status: "declined",
      message: errors.cardNumber ?? "Check the card details and try again.",
    };
  }

  switch (card.outcome) {
    case "approved":
      return { status: "approved", authorizationId: randomId("fakeauth"), amount };
    case "declined":
      return { status: "declined", message: card.message };
    case "error":
      return { status: "error", message: card.message };
  }
}

/** True for references this fake gateway issues. The mock store only accepts these. */
export function isFakeAuthorizationId(value: string): boolean {
  return /^fakeauth_[0-9a-f]{20}$/.test(value);
}
