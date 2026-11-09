import { cacheLife } from "next/cache";
import { createStoreAdapter } from "./create-store";

/**
 * Cached, server-side catalog reads used for routing, 404s, and page titles.
 * They never include live stock: stock, carts, and orders are always read in
 * the browser through the StoreAdapter.
 */

export async function getProductHandles(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  const products = await createStoreAdapter().getProducts();
  return products.map((product) => product.handle);
}

export async function getCollectionHandles(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  const collections = await createStoreAdapter().getCollections();
  return collections.map((collection) => collection.handle);
}

export async function getProductSummary(handle: string) {
  "use cache";
  cacheLife("hours");
  const product = await createStoreAdapter().getProduct(handle);
  return product && { title: product.title, description: product.description };
}

export async function getCollectionSummary(handle: string) {
  "use cache";
  cacheLife("hours");
  const collection = await createStoreAdapter().getCollection(handle);
  return collection && { title: collection.title, description: collection.description };
}
