import type { StoreAdapter } from "./adapter";
import { MockStoreAdapter } from "./mock/mock-adapter";
import { createDefaultBrowserStorage, createMemoryStorage } from "./mock/storage";
import { ShopifyStoreAdapter } from "./shopify/shopify-adapter";

/**
 * Picks the store backend from environment variables. The mock store is the
 * default; Shopify is used only when NEXT_PUBLIC_STORE_BACKEND=shopify.
 */
export function createStoreAdapter(): StoreAdapter {
  if (process.env.NEXT_PUBLIC_STORE_BACKEND === "shopify") {
    const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
    if (!storeDomain || !storefrontToken) {
      throw new Error(
        "NEXT_PUBLIC_STORE_BACKEND=shopify also needs NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN. See README.md.",
      );
    }
    return new ShopifyStoreAdapter({
      storeDomain,
      storefrontToken,
      apiVersion: process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION,
    });
  }

  const storage = typeof window === "undefined" ? createMemoryStorage() : createDefaultBrowserStorage();
  return new MockStoreAdapter({ storage });
}
