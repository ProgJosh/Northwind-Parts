import { isFakeAuthorizationId } from "@/lib/fake-gateway";
import { StoreError, type CheckoutMode, type StoreAdapter } from "../adapter";
import { randomId } from "../ids";
import { money, multiplyMoney, sumMoney } from "../money";
import { applyProductQuery } from "../product-query";
import { quantityProblem } from "../stock";
import type {
  Cart,
  CartBuyerIdentity,
  CartLine,
  Collection,
  CreateOrderInput,
  Order,
  Product,
  ProductQuery,
} from "../types";
import { merchandiseLabel } from "../variants";
import {
  buildCollection,
  buildProduct,
  seedCatalog,
  type SeedCatalog,
  type SeedProduct,
  type SeedVariant,
} from "./catalog";
import { cartCost, DEFAULT_SHIPPING_HANDLE, deliveryOptionsFor, SHIPPING_METHODS } from "./pricing";
import { MOCK_DB_VERSION, type MockCartRecord, type MockDb, type MockDbStorage } from "./storage";

const FIRST_ORDER_NUMBER = 1001;
const CART_EXPIRED = "Your cart has expired. Please add the items again.";

export interface MockStoreOptions {
  storage: MockDbStorage;
  catalog?: SeedCatalog;
  now?: () => Date;
}

/**
 * A complete store backend that keeps its state in a MockDbStorage
 * (localStorage in the browser). Every call reloads the stored state first,
 * so several tabs stay consistent.
 */
export class MockStoreAdapter implements StoreAdapter {
  readonly checkoutMode: CheckoutMode = "simulated";

  private readonly storage: MockDbStorage;
  private readonly catalog: SeedCatalog;
  private readonly now: () => Date;
  private readonly variants = new Map<string, { product: SeedProduct; variant: SeedVariant }>();

  constructor({ storage, catalog = seedCatalog, now = () => new Date() }: MockStoreOptions) {
    this.storage = storage;
    this.catalog = catalog;
    this.now = now;
    for (const product of catalog.products) {
      for (const variant of product.variants) this.variants.set(variant.id, { product, variant });
    }
  }

  // Catalog

  async getProducts(query?: ProductQuery): Promise<Product[]> {
    const { inventory } = this.load();
    const products = this.catalog.products.map((seed) => buildProduct(seed, this.catalog, inventory));
    return applyProductQuery(products, query);
  }

  async getProduct(handle: string): Promise<Product | null> {
    const seed = this.catalog.products.find((product) => product.handle === handle);
    return seed ? buildProduct(seed, this.catalog, this.load().inventory) : null;
  }

  async getCollections(): Promise<Collection[]> {
    return this.catalog.collections.map(buildCollection);
  }

  async getCollection(handle: string): Promise<Collection | null> {
    const seed = this.catalog.collections.find((collection) => collection.handle === handle);
    return seed ? buildCollection(seed) : null;
  }

  // Cart

  async createCart(): Promise<Cart> {
    const db = this.load();
    const record: MockCartRecord = {
      id: randomId("cart"),
      lines: [],
      buyerIdentity: null,
      deliveryOptionHandle: DEFAULT_SHIPPING_HANDLE,
      updatedAt: this.now().toISOString(),
    };
    db.carts[record.id] = record;
    this.storage.write(db);
    return this.toCart(record, db);
  }

  async getCart(cartId: string): Promise<Cart | null> {
    const db = this.load();
    const record = db.carts[cartId];
    return record ? this.toCart(record, db) : null;
  }

  async addToCart(cartId: string, variantId: string, quantity: number): Promise<Cart> {
    return this.changeCart(cartId, (record, db) => {
      if (!this.variants.has(variantId)) {
        throw new StoreError("NOT_FOUND", "That product is no longer available.");
      }
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new StoreError("INVALID_INPUT", "Quantity must be at least 1.");
      }
      const line = record.lines.find((candidate) => candidate.variantId === variantId);
      const requested = (line?.quantity ?? 0) + quantity;
      this.assertStock(db, variantId, requested);
      if (line) line.quantity = requested;
      else record.lines.push({ id: randomId("line"), variantId, quantity });
    });
  }

  async updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
    return this.changeCart(cartId, (record, db) => {
      const line = record.lines.find((candidate) => candidate.id === lineId);
      if (!line) throw new StoreError("NOT_FOUND", "That item is no longer in your cart.");
      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new StoreError("INVALID_INPUT", "Quantity must be a whole number.");
      }
      if (quantity === 0) {
        // Like Shopify's cartLinesUpdate, a quantity of 0 removes the line.
        record.lines = record.lines.filter((candidate) => candidate.id !== lineId);
        return;
      }
      this.assertStock(db, line.variantId, quantity);
      line.quantity = quantity;
    });
  }

  async removeCartLine(cartId: string, lineId: string): Promise<Cart> {
    return this.changeCart(cartId, (record) => {
      record.lines = record.lines.filter((line) => line.id !== lineId);
    });
  }

  async updateBuyerIdentity(cartId: string, buyerIdentity: CartBuyerIdentity): Promise<Cart> {
    return this.changeCart(cartId, (record) => {
      record.buyerIdentity = {
        ...buyerIdentity,
        deliveryAddress: buyerIdentity.deliveryAddress && { ...buyerIdentity.deliveryAddress },
      };
    });
  }

  async selectDeliveryOption(cartId: string, handle: string): Promise<Cart> {
    if (!SHIPPING_METHODS.some((method) => method.handle === handle)) {
      throw new StoreError("INVALID_INPUT", "Choose one of the delivery options.");
    }
    return this.changeCart(cartId, (record) => {
      record.deliveryOptionHandle = handle;
    });
  }

  // Orders

  async createOrder({ cartId, paymentReference }: CreateOrderInput): Promise<Order> {
    const db = this.load();
    const record = db.carts[cartId];
    if (!record) throw new StoreError("NOT_FOUND", CART_EXPIRED);

    const cart = this.toCart(record, db);
    const identity = cart.buyerIdentity;
    const address = identity?.deliveryAddress;
    const shipping = cart.deliveryOptions.find((option) => option.handle === cart.selectedDeliveryOptionHandle);
    if (cart.lines.length === 0) throw new StoreError("INVALID_INPUT", "Your cart is empty.");
    if (!identity || !address || !shipping) {
      throw new StoreError("INVALID_INPUT", "Add your contact and delivery details before paying.");
    }
    if (!isFakeAuthorizationId(paymentReference)) {
      throw new StoreError("INVALID_INPUT", "The payment was not authorised.");
    }

    // Stock may have changed (for example in another tab) since the items were added.
    for (const line of record.lines) this.assertStock(db, line.variantId, line.quantity);
    for (const line of record.lines) db.inventory[line.variantId] -= line.quantity;

    const order: Order = {
      id: randomId("order"),
      name: `#DEMO-${db.nextOrderNumber}`,
      processedAt: this.now().toISOString(),
      email: identity.email,
      shippingAddress: { ...address },
      shippingLine: { title: shipping.title, price: shipping.estimatedCost },
      lineItems: cart.lines.map((line) => ({
        title: line.merchandise.product.title,
        variantTitle: line.merchandise.title,
        sku: line.merchandise.sku,
        quantity: line.quantity,
        image: line.merchandise.image,
        originalUnitPrice: line.cost.amountPerQuantity,
        originalTotalPrice: line.cost.totalAmount,
      })),
      subtotalPrice: cart.cost.subtotalAmount,
      totalShippingPrice: shipping.estimatedCost,
      totalTax: cart.cost.totalTaxAmount ?? money(0, this.catalog.currencyCode),
      totalPrice: cart.cost.totalAmount,
      taxesIncluded: cart.cost.taxesIncluded,
      financialStatus: "PAID",
      paymentReference,
    };

    db.orders.unshift(order);
    db.nextOrderNumber += 1;
    delete db.carts[cartId];
    this.storage.write(db);
    return order;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return this.load().orders.find((order) => order.id === orderId) ?? null;
  }

  async getOrders(): Promise<Order[]> {
    return this.load().orders;
  }

  async resetDemoData(): Promise<void> {
    this.storage.write(this.seed());
  }

  // Internals

  private seed(): MockDb {
    const inventory: Record<string, number> = {};
    for (const { variant } of this.variants.values()) inventory[variant.id] = variant.inventory;
    return { version: MOCK_DB_VERSION, inventory, carts: {}, orders: [], nextOrderNumber: FIRST_ORDER_NUMBER };
  }

  private load(): MockDb {
    const stored = this.storage.read();
    if (stored?.version === MOCK_DB_VERSION) {
      // Variants added to the catalog after the data was saved start with their seeded stock.
      for (const { variant } of this.variants.values()) {
        stored.inventory[variant.id] ??= variant.inventory;
      }
      return stored;
    }
    const fresh = this.seed();
    this.storage.write(fresh);
    return fresh;
  }

  private changeCart(cartId: string, change: (record: MockCartRecord, db: MockDb) => void): Cart {
    const db = this.load();
    const record = db.carts[cartId];
    if (!record) throw new StoreError("NOT_FOUND", CART_EXPIRED);
    change(record, db);
    record.updatedAt = this.now().toISOString();
    this.storage.write(db);
    return this.toCart(record, db);
  }

  private assertStock(db: MockDb, variantId: string, requested: number): void {
    const entry = this.variants.get(variantId);
    if (!entry) throw new StoreError("NOT_FOUND", "That product is no longer available.");
    const left = db.inventory[variantId] ?? 0;
    const problem = quantityProblem(
      { availableForSale: left > 0, quantityAvailable: left },
      merchandiseLabel(entry.product.title, entry.variant.title),
      requested,
    );
    if (problem) throw new StoreError("OUT_OF_STOCK", problem);
  }

  private toCart(record: MockCartRecord, db: MockDb): Cart {
    const lines: CartLine[] = [];
    for (const line of record.lines) {
      const entry = this.variants.get(line.variantId);
      if (!entry) continue; // the variant was removed from the catalog after it was added
      const product = buildProduct(entry.product, this.catalog, db.inventory);
      const variant = product.variants.find((candidate) => candidate.id === line.variantId);
      if (!variant) continue;
      lines.push({
        id: line.id,
        quantity: line.quantity,
        merchandise: {
          ...variant,
          image: variant.image ?? product.featuredImage,
          product: { handle: product.handle, title: product.title },
        },
        cost: { amountPerQuantity: variant.price, totalAmount: multiplyMoney(variant.price, line.quantity) },
      });
    }

    const subtotal = sumMoney(
      lines.map((line) => line.cost.totalAmount),
      this.catalog.currencyCode,
    );
    const deliveryOptions = lines.length > 0 ? deliveryOptionsFor(subtotal) : [];
    const selected =
      deliveryOptions.find((option) => option.handle === record.deliveryOptionHandle) ??
      deliveryOptions[0] ??
      null;

    return {
      id: record.id,
      checkoutUrl: null,
      totalQuantity: lines.reduce((total, line) => total + line.quantity, 0),
      lines,
      buyerIdentity: record.buyerIdentity,
      deliveryOptions,
      selectedDeliveryOptionHandle: selected?.handle ?? null,
      cost: cartCost(subtotal, selected),
    };
  }
}
