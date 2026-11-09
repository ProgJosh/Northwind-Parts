import type { CurrencyCode, Money } from "./types";

/** Locale used for prices and dates in this demo (Swiss English: "CHF 1'234.50"). */
export const DISPLAY_LOCALE = "en-CH";

const formatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(locale: string, currencyCode: CurrencyCode): Intl.NumberFormat {
  const key = `${locale}|${currencyCode}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: "currency", currency: currencyCode });
    formatters.set(key, formatter);
  }
  return formatter;
}

/** Number of minor-unit digits for a currency (2 for CHF, 0 for JPY). */
function minorUnitDigits(currencyCode: CurrencyCode): number {
  return currencyFormatter("en", currencyCode).resolvedOptions().maximumFractionDigits ?? 2;
}

export function money(amountMinor: number, currencyCode: CurrencyCode): Money {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new RangeError(`Money must be a whole number of minor units, got ${amountMinor}.`);
  }
  return { amountMinor, currencyCode };
}

export function formatMoney(value: Money, locale: string = DISPLAY_LOCALE): string {
  const divisor = 10 ** minorUnitDigits(value.currencyCode);
  return currencyFormatter(locale, value.currencyCode).format(value.amountMinor / divisor);
}

export function multiplyMoney(value: Money, quantity: number): Money {
  if (!Number.isSafeInteger(quantity)) throw new RangeError(`Quantity must be a whole number, got ${quantity}.`);
  return money(value.amountMinor * quantity, value.currencyCode);
}

export function sumMoney(values: readonly Money[], currencyCode: CurrencyCode): Money {
  let total = 0;
  for (const value of values) {
    if (value.currencyCode !== currencyCode) {
      throw new RangeError(`Cannot add ${value.currencyCode} to ${currencyCode}.`);
    }
    total += value.amountMinor;
  }
  return money(total, currencyCode);
}

/**
 * Converts a decimal string such as Shopify's `"49.9"` into minor units (4990)
 * without going through floating point. Extra digits are rounded half up.
 */
export function decimalToMinorUnits(decimal: string, currencyCode: CurrencyCode): number {
  const match = /^(-)?(\d+)(?:\.(\d+))?$/.exec(decimal.trim());
  if (!match) throw new RangeError(`Not a decimal amount: "${decimal}".`);
  const [, sign, whole, fraction = ""] = match;
  const digits = minorUnitDigits(currencyCode);
  const kept = fraction.slice(0, digits).padEnd(digits, "0");
  const roundUp = fraction.length > digits && Number(fraction[digits]) >= 5;
  const value = Number(whole) * 10 ** digits + Number(kept || "0") + (roundUp ? 1 : 0);
  return sign ? -value : value;
}
