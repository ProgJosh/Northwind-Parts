import type {
  Cart,
  CartBuyerIdentity,
  Collection,
  CreateOrderInput,
  Order,
  Product,
  ProductQuery,
} from "./types";

/**
 * How payment happens for this backend.
 * - "simulated": this app takes the (fake) payment and calls `createOrder`.
 * - "hosted": the shopper is sent to `cart.checkoutUrl` (Shopify's own checkout).
 */
export type CheckoutMode = "simulated" | "hosted";

/**
 * The single source of truth for products, stock, carts, and orders.
 * The UI talks only to this interface, so it never knows whether the data
 * comes from the mock store or from Shopify.
 */
export interface StoreAdapter {
  readonly checkoutMode: CheckoutMode;

  getProducts(query?: ProductQuery): Promise<Product[]>;
  getProduct(handle: string): Promise<Product | null>;
  getCollections(): Promise<Collection[]>;
  getCollection(handle: string): Promise<Collection | null>;

  createCart(): Promise<Cart>;
  getCart(cartId: string): Promise<Cart | null>;
  addToCart(cartId: string, variantId: string, quantity: number): Promise<Cart>;
  updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart>;
  removeCartLine(cartId: string, lineId: string): Promise<Cart>;
  updateBuyerIdentity(cartId: string, buyerIdentity: CartBuyerIdentity): Promise<Cart>;
  selectDeliveryOption(cartId: string, handle: string): Promise<Cart>;

  createOrder(input: CreateOrderInput): Promise<Order>;
  getOrder(orderId: string): Promise<Order | null>;
  getOrders(): Promise<Order[]>;

  /** Restores seeded stock and deletes demo carts and orders. Mock backend only. */
  resetDemoData?(): Promise<void>;
}

export type StoreErrorCode =
  | "NOT_FOUND"
  | "OUT_OF_STOCK"
  | "INVALID_INPUT"
  | "UNSUPPORTED"
  | "BACKEND";

/** An error whose message is safe to show to shoppers. */
export class StoreError extends Error {
  readonly code: StoreErrorCode;

  constructor(code: StoreErrorCode, message: string) {
    super(message);
    this.name = "StoreError";
    this.code = code;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof StoreError) return error.message;
  return "Something went wrong while talking to the store. Please try again.";
}
