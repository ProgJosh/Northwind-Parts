import { StoreError, type CheckoutMode, type StoreAdapter } from "../adapter";
import { applyProductQuery } from "../product-query";
import { quantityProblem } from "../stock";
import type {
  Cart,
  CartBuyerIdentity,
  Collection,
  Order,
  Product,
  ProductQuery,
} from "../types";
import { merchandiseLabel } from "../variants";
import {
  toCart,
  toCollection,
  toProduct,
  type ShopifyCart,
  type ShopifyCollection,
  type ShopifyProduct,
} from "./mappers";
import {
  CART_BUYER_IDENTITY_UPDATE,
  CART_CREATE,
  CART_LINES_ADD,
  CART_LINES_REMOVE,
  CART_LINES_UPDATE,
  CART_QUERY,
  COLLECTION_QUERY,
  COLLECTIONS_QUERY,
  PRODUCT_QUERY,
  PRODUCTS_QUERY,
  VARIANT_STOCK_QUERY,
} from "./queries";

/** A supported Storefront API version. Override with NEXT_PUBLIC_SHOPIFY_API_VERSION. */
const DEFAULT_SHOPIFY_API_VERSION = "2026-07";

/** Enough for a small demo catalog; larger stores should filter in the GraphQL query. */
const PRODUCT_PAGE_SIZE = 100;

const HOSTED_CHECKOUT_ONLY =
  "Orders are placed in Shopify's hosted checkout. View them in your Shopify admin.";

export interface ShopifyConfig {
  /** e.g. "your-dev-store.myshopify.com" */
  storeDomain: string;
  /** A Storefront API public access token. Never commit it. */
  storefrontToken: string;
  apiVersion?: string;
  fetch?: typeof fetch;
}

interface CartPayload {
  cart: ShopifyCart | null;
  userErrors: { message: string }[];
}

interface VariantStock {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  product: { title: string };
}

/**
 * Talks to a real Shopify store through the Storefront API. Off by default:
 * set NEXT_PUBLIC_STORE_BACKEND=shopify and test only against a development store.
 * Payment always happens in Shopify's hosted checkout (`cart.checkoutUrl`).
 */
export class ShopifyStoreAdapter implements StoreAdapter {
  readonly checkoutMode: CheckoutMode = "hosted";

  private readonly endpoint: string;
  private readonly token: string;
  private readonly fetcher: typeof fetch;

  constructor({ storeDomain, storefrontToken, apiVersion, fetch: fetcher }: ShopifyConfig) {
    const version = apiVersion || DEFAULT_SHOPIFY_API_VERSION;
    this.endpoint = `https://${storeDomain}/api/${version}/graphql.json`;
    this.token = storefrontToken;
    this.fetcher = fetcher ?? ((input, init) => fetch(input, init));
  }

  // Catalog

  async getProducts(query?: ProductQuery): Promise<Product[]> {
    const data = await this.request<{ products: { nodes: ShopifyProduct[] } }>(PRODUCTS_QUERY, {
      first: PRODUCT_PAGE_SIZE,
    });
    return applyProductQuery(data.products.nodes.map(toProduct), query);
  }

  async getProduct(handle: string): Promise<Product | null> {
    const data = await this.request<{ product: ShopifyProduct | null }>(PRODUCT_QUERY, { handle });
    return data.product ? toProduct(data.product) : null;
  }

  async getCollections(): Promise<Collection[]> {
    const data = await this.request<{ collections: { nodes: ShopifyCollection[] } }>(COLLECTIONS_QUERY);
    return data.collections.nodes.map(toCollection);
  }

  async getCollection(handle: string): Promise<Collection | null> {
    const data = await this.request<{ collection: ShopifyCollection | null }>(COLLECTION_QUERY, { handle });
    return data.collection ? toCollection(data.collection) : null;
  }

  // Cart

  async createCart(): Promise<Cart> {
    return this.cartMutation(CART_CREATE, "cartCreate", {});
  }

  async getCart(cartId: string): Promise<Cart | null> {
    const data = await this.request<{ cart: ShopifyCart | null }>(CART_QUERY, { cartId });
    return data.cart ? toCart(data.cart) : null;
  }

  async addToCart(cartId: string, variantId: string, quantity: number): Promise<Cart> {
    // Shopify does not reserve stock, so this store's stock rule is checked before adding.
    const [cart, stock] = await Promise.all([
      this.requireCart(cartId),
      this.request<{ node: VariantStock | null }>(VARIANT_STOCK_QUERY, { id: variantId }),
    ]);
    const variant = stock.node;
    if (!variant) throw new StoreError("NOT_FOUND", "That product is no longer available.");
    const inCart = cart.lines.find((line) => line.merchandise.id === variantId)?.quantity ?? 0;
    const problem = quantityProblem(
      variant,
      merchandiseLabel(variant.product.title, variant.title),
      inCart + quantity,
    );
    if (problem) throw new StoreError("OUT_OF_STOCK", problem);
    return this.cartMutation(CART_LINES_ADD, "cartLinesAdd", {
      cartId,
      lines: [{ merchandiseId: variantId, quantity }],
    });
  }

  async updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
    if (quantity > 0) {
      const cart = await this.requireCart(cartId);
      const line = cart.lines.find((candidate) => candidate.id === lineId);
      if (!line) throw new StoreError("NOT_FOUND", "That item is no longer in your cart.");
      const { merchandise } = line;
      const problem = quantityProblem(
        merchandise,
        merchandiseLabel(merchandise.product.title, merchandise.title),
        quantity,
      );
      if (problem) throw new StoreError("OUT_OF_STOCK", problem);
    }
    return this.cartMutation(CART_LINES_UPDATE, "cartLinesUpdate", {
      cartId,
      lines: [{ id: lineId, quantity }],
    });
  }

  async removeCartLine(cartId: string, lineId: string): Promise<Cart> {
    return this.cartMutation(CART_LINES_REMOVE, "cartLinesRemove", { cartId, lineIds: [lineId] });
  }

  /** Shopify's checkout asks for the address itself, so only email and country are sent. */
  async updateBuyerIdentity(cartId: string, buyerIdentity: CartBuyerIdentity): Promise<Cart> {
    return this.cartMutation(CART_BUYER_IDENTITY_UPDATE, "cartBuyerIdentityUpdate", {
      cartId,
      buyerIdentity: { email: buyerIdentity.email, countryCode: buyerIdentity.countryCode },
    });
  }

  async selectDeliveryOption(): Promise<Cart> {
    throw new StoreError("UNSUPPORTED", "Delivery is chosen in Shopify's hosted checkout.");
  }

  // Orders: created by Shopify's hosted checkout, not by this app.

  async createOrder(): Promise<Order> {
    throw new StoreError("UNSUPPORTED", HOSTED_CHECKOUT_ONLY);
  }

  async getOrder(): Promise<Order | null> {
    throw new StoreError("UNSUPPORTED", HOSTED_CHECKOUT_ONLY);
  }

  async getOrders(): Promise<Order[]> {
    throw new StoreError("UNSUPPORTED", HOSTED_CHECKOUT_ONLY);
  }

  // Internals

  private async requireCart(cartId: string): Promise<Cart> {
    const cart = await this.getCart(cartId);
    if (!cart) throw new StoreError("NOT_FOUND", "Your cart has expired. Please add the items again.");
    return cart;
  }

  private async cartMutation(
    document: string,
    field: string,
    variables: Record<string, unknown>,
  ): Promise<Cart> {
    const data = await this.request<Record<string, CartPayload>>(document, variables);
    const payload = data[field];
    const userError = payload?.userErrors[0];
    if (userError) throw new StoreError("INVALID_INPUT", userError.message);
    if (!payload?.cart) throw new StoreError("NOT_FOUND", "Your cart has expired. Please add the items again.");
    return toCart(payload.cart);
  }

  private async request<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    let response: Response;
    try {
      response = await this.fetcher(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": this.token,
        },
        body: JSON.stringify({ query, variables }),
      });
    } catch {
      throw new StoreError("BACKEND", "Could not reach the store. Check your connection and try again.");
    }
    if (!response.ok) {
      throw new StoreError("BACKEND", `The store returned an error (HTTP ${response.status}).`);
    }
    const body = (await response.json()) as { data?: T; errors?: { message: string }[] };
    if (body.errors?.length || !body.data) {
      throw new StoreError("BACKEND", body.errors?.[0]?.message ?? "The store sent an empty response.");
    }
    return body.data;
  }
}
