import { describe, expect, it, vi } from "vitest";
import { money } from "../money";
import type { ShopifyCart, ShopifyProduct, ShopifyVariant } from "./mappers";
import { ShopifyStoreAdapter } from "./shopify-adapter";

const chfDecimal = (amount: string) => ({ amount, currencyCode: "CHF" });

function shopifyVariant(id: string, finish: string, price: string, quantityAvailable: number): ShopifyVariant {
  return {
    id: `gid://shopify/ProductVariant/${id}`,
    title: finish,
    sku: `BELL-${id}`,
    availableForSale: quantityAvailable > 0,
    quantityAvailable,
    price: chfDecimal(price),
    compareAtPrice: null,
    selectedOptions: [{ name: "Finish", value: finish }],
    image: null,
  };
}

const BELL: ShopifyProduct = {
  id: "gid://shopify/Product/1",
  handle: "trail-bell",
  title: "Trail Bell",
  vendor: "Dev Store",
  productType: "Bell",
  description: "A loud bell.",
  tags: ["city"],
  publishedAt: "2026-01-01T00:00:00Z",
  availableForSale: true,
  featuredImage: { url: "https://cdn.shopify.com/bell.png", altText: null, width: 600, height: 600 },
  images: { nodes: [{ url: "https://cdn.shopify.com/bell.png", altText: null, width: 600, height: 600 }] },
  priceRange: { minVariantPrice: chfDecimal("19.9"), maxVariantPrice: chfDecimal("24.5") },
  collections: { nodes: [{ handle: "accessories" }] },
  variants: { nodes: [shopifyVariant("11", "Brass", "19.9", 1), shopifyVariant("12", "Black", "24.5", 0)] },
};

function shopifyCart(quantity: number): ShopifyCart {
  return {
    id: "gid://shopify/Cart/c1",
    checkoutUrl: "https://demo-store.myshopify.com/cart/c/c1",
    totalQuantity: quantity,
    buyerIdentity: { email: null, countryCode: "CH" },
    cost: { subtotalAmount: chfDecimal("19.9"), totalAmount: chfDecimal("19.9") },
    lines: {
      nodes:
        quantity === 0
          ? []
          : [
              {
                id: "gid://shopify/CartLine/l1",
                quantity,
                cost: { amountPerQuantity: chfDecimal("19.9"), totalAmount: chfDecimal("19.9") },
                merchandise: {
                  ...BELL.variants.nodes[0],
                  product: { handle: BELL.handle, title: BELL.title, featuredImage: BELL.featuredImage },
                },
              },
            ],
    },
  };
}

/** A fake Storefront API that answers each named GraphQL operation with canned data. */
function fakeStorefront(data: Record<string, unknown>) {
  const operations: string[] = [];
  const fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    const { query } = JSON.parse(String(init?.body)) as { query: string };
    const operation = /(?:query|mutation)\s+(\w+)/.exec(query)?.[1] ?? "unknown";
    operations.push(operation);
    return Response.json({ data: data[operation] });
  });
  const adapter = new ShopifyStoreAdapter({
    storeDomain: "demo-store.myshopify.com",
    storefrontToken: "public-test-token",
    fetch,
  });
  return { adapter, fetch, operations };
}

describe("ShopifyStoreAdapter", () => {
  it("calls the Storefront API with the public token and API version", async () => {
    const { adapter, fetch } = fakeStorefront({ Products: { products: { nodes: [] } } });
    await adapter.getProducts();

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://demo-store.myshopify.com/api/2026-07/graphql.json");
    expect(new Headers(init?.headers).get("X-Shopify-Storefront-Access-Token")).toBe("public-test-token");
  });

  it("maps Storefront products into the shared types, with money in minor units", async () => {
    const { adapter } = fakeStorefront({ Product: { product: BELL } });
    const product = await adapter.getProduct("trail-bell");

    expect(product).toMatchObject({
      handle: "trail-bell",
      collectionHandles: ["accessories"],
      options: [{ name: "Finish", values: ["Brass", "Black"] }],
      priceRange: { minVariantPrice: money(1_990, "CHF"), maxVariantPrice: money(2_450, "CHF") },
      featuredImage: { altText: "Trail Bell", width: 600 },
    });
    expect(product?.variants[1]).toMatchObject({ sku: "BELL-12", quantityAvailable: 0, availableForSale: false });
  });

  it("applies the same search and filters as the mock store", async () => {
    const soldOut = { ...BELL, handle: "old-bell", title: "Old Bell", availableForSale: false };
    const { adapter } = fakeStorefront({ Products: { products: { nodes: [BELL, soldOut] } } });
    expect((await adapter.getProducts({ inStockOnly: true })).map((product) => product.handle)).toEqual([
      "trail-bell",
    ]);
  });

  it("checks stock before adding to the cart", async () => {
    const { adapter, operations } = fakeStorefront({
      Cart: { cart: shopifyCart(1) },
      VariantStock: { node: { ...BELL.variants.nodes[0], product: { title: "Trail Bell" } } },
    });

    await expect(adapter.addToCart("gid://shopify/Cart/c1", BELL.variants.nodes[0].id, 1)).rejects.toMatchObject({
      code: "OUT_OF_STOCK",
      message: "Only 1 of Trail Bell (Brass) is available.",
    });
    expect(operations).not.toContain("CartLinesAdd");
  });

  it("turns Shopify user errors into store errors", async () => {
    const { adapter } = fakeStorefront({
      Cart: { cart: shopifyCart(0) },
      VariantStock: { node: { ...BELL.variants.nodes[0], product: { title: "Trail Bell" } } },
      CartLinesAdd: { cartLinesAdd: { cart: null, userErrors: [{ message: "Merchandise is not for sale." }] } },
    });
    await expect(adapter.addToCart("gid://shopify/Cart/c1", BELL.variants.nodes[0].id, 1)).rejects.toMatchObject({
      code: "INVALID_INPUT",
      message: "Merchandise is not for sale.",
    });
  });

  it("hands payment to Shopify's hosted checkout", async () => {
    const { adapter } = fakeStorefront({ Cart: { cart: shopifyCart(1) } });
    const cart = await adapter.getCart("gid://shopify/Cart/c1");

    expect(adapter.checkoutMode).toBe("hosted");
    expect(cart).toMatchObject({
      checkoutUrl: "https://demo-store.myshopify.com/cart/c/c1",
      cost: { shippingAmount: null, totalTaxAmount: null, totalAmount: money(1_990, "CHF") },
    });
    await expect(adapter.createOrder()).rejects.toMatchObject({ code: "UNSUPPORTED" });
  });
});
