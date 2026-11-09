import { MockStoreAdapter } from "@/lib/commerce/mock/mock-adapter";
import { createMemoryStorage, type MockDbStorage } from "@/lib/commerce/mock/storage";
import type { CartBuyerIdentity } from "@/lib/commerce/types";

/** Seeded variant ids from data/catalog.json, with their starting stock. */
export const VARIANTS = {
  ridge29: "gid://northwind/ProductVariant/100102", // Ridge Trail Tyre 29 × 2.4, CHF 64.90, 4 in stock
  ridge275: "gid://northwind/ProductVariant/100101", // Ridge Trail Tyre 27.5 × 2.4, CHF 64.90, 14 in stock
  gravel38: "gid://northwind/ProductVariant/100201", // Allroad Gravel Tyre 700 × 38c, CHF 52.90, 20 in stock
  tubePresta: "gid://northwind/ProductVariant/100301", // Sealed Inner Tube, CHF 11.90, 40 in stock
  pump: "gid://northwind/ProductVariant/101401", // Track Floor Pump, CHF 59.00, sold out
} as const;

/** A reference in the format the fake gateway issues. */
export const FAKE_AUTHORIZATION = "fakeauth_0123456789abcdef0123";

export const BUYER: CartBuyerIdentity = {
  email: "anna@example.com",
  countryCode: "CH",
  deliveryAddress: {
    firstName: "Anna",
    lastName: "Muster",
    address1: "Seestrasse 12",
    address2: "",
    zip: "8002",
    city: "Zürich",
    countryCode: "CH",
    phone: "",
  },
};

export function createMockStore(storage: MockDbStorage = createMemoryStorage()): MockStoreAdapter {
  return new MockStoreAdapter({ storage, now: () => new Date("2026-11-09T10:00:00Z") });
}
