import { StoreError } from "../adapter";
import type { CartBuyerIdentity, Order } from "../types";

/** Bump when the stored shape changes; older data is then reseeded. */
export const MOCK_DB_VERSION = 1;

const BROWSER_STORAGE_KEY = "northwind-parts:mock-db";

export interface MockCartRecord {
  id: string;
  lines: { id: string; variantId: string; quantity: number }[];
  buyerIdentity: CartBuyerIdentity | null;
  deliveryOptionHandle: string;
  updatedAt: string;
}

/** Everything the mock store can change. The catalog itself is read-only seed data. */
export interface MockDb {
  version: number;
  /** Units in stock per variant id. */
  inventory: Record<string, number>;
  carts: Record<string, MockCartRecord>;
  /** Newest first. */
  orders: Order[];
  nextOrderNumber: number;
}

export interface MockDbStorage {
  read(): MockDb | null;
  write(db: MockDb): void;
}

/** In-memory storage for the server and for tests. State is lost when the process ends. */
export function createMemoryStorage(): MockDbStorage {
  let snapshot: string | null = null;
  return {
    read: () => (snapshot === null ? null : (JSON.parse(snapshot) as MockDb)),
    write: (db) => {
      snapshot = JSON.stringify(db);
    },
  };
}

/**
 * Persists the mock store in the visitor's browser, so every visitor gets a
 * private sandbox and nothing they type is sent to a server.
 */
function createBrowserStorage(storage: Storage, key = BROWSER_STORAGE_KEY): MockDbStorage {
  return {
    read() {
      try {
        const raw = storage.getItem(key);
        return raw === null ? null : (JSON.parse(raw) as MockDb);
      } catch {
        return null; // unreadable or corrupt data is reseeded
      }
    },
    write(db) {
      try {
        storage.setItem(key, JSON.stringify(db));
      } catch {
        throw new StoreError("BACKEND", "Your browser blocked saving the demo store data. Free up site storage and try again.");
      }
    },
  };
}

/** localStorage when the browser allows it, otherwise memory (state then resets on reload). */
export function createDefaultBrowserStorage(): MockDbStorage {
  try {
    const probe = "northwind-parts:probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return createBrowserStorage(window.localStorage);
  } catch {
    return createMemoryStorage();
  }
}
