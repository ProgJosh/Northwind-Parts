/**
 * Shopify-shaped commerce types.
 *
 * Names and nesting follow the Shopify Storefront API (Product, ProductVariant,
 * Collection, Cart, CartLine, Order) so the UI runs unchanged on the mock
 * backend or on a real Shopify store.
 *
 * One deliberate difference: money is held as integer minor units (rappen for
 * CHF), never as floats or decimal strings, so totals never drift.
 */

export type CurrencyCode = string;

/** An amount in integer minor units, e.g. CHF 49.90 is `{ amountMinor: 4990 }`. */
export interface Money {
  amountMinor: number;
  currencyCode: CurrencyCode;
}

export interface Image {
  url: string;
  altText: string;
  width: number;
  height: number;
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  price: Money;
  compareAtPrice: Money | null;
  availableForSale: boolean;
  /** Units left to sell, or null when the backend does not track inventory. */
  quantityAvailable: number | null;
  selectedOptions: SelectedOption[];
  image: Image | null;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  description: string;
  tags: string[];
  /** Handles of the collections this product belongs to. */
  collectionHandles: string[];
  publishedAt: string;
  featuredImage: Image | null;
  images: Image[];
  options: ProductOption[];
  variants: ProductVariant[];
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  availableForSale: boolean;
}

export interface Collection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: Image | null;
}

export interface CartMerchandise extends ProductVariant {
  product: { handle: string; title: string };
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: CartMerchandise;
  cost: { amountPerQuantity: Money; totalAmount: Money };
}

export interface MailingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  zip: string;
  city: string;
  countryCode: string;
  phone: string;
}

export interface CartBuyerIdentity {
  email: string;
  countryCode: string;
  deliveryAddress: MailingAddress | null;
}

export interface DeliveryOption {
  handle: string;
  title: string;
  description: string;
  estimatedCost: Money;
}

export interface CartCost {
  subtotalAmount: Money;
  /** Null while shipping is still unknown, e.g. before a hosted checkout. */
  shippingAmount: Money | null;
  /** Null while tax is still unknown, e.g. before a hosted checkout. */
  totalTaxAmount: Money | null;
  totalAmount: Money;
  /** True when prices already include tax (VAT), so the tax line is informational. */
  taxesIncluded: boolean;
}

export interface Cart {
  id: string;
  /** Hosted checkout URL (Shopify). Null when this app runs the checkout itself. */
  checkoutUrl: string | null;
  totalQuantity: number;
  lines: CartLine[];
  buyerIdentity: CartBuyerIdentity | null;
  deliveryOptions: DeliveryOption[];
  selectedDeliveryOptionHandle: string | null;
  cost: CartCost;
}

export interface OrderLineItem {
  title: string;
  variantTitle: string;
  sku: string;
  quantity: number;
  image: Image | null;
  originalUnitPrice: Money;
  originalTotalPrice: Money;
}

export interface Order {
  id: string;
  /** Human-readable order number, e.g. "#DEMO-1001". */
  name: string;
  processedAt: string;
  email: string;
  shippingAddress: MailingAddress;
  shippingLine: { title: string; price: Money };
  lineItems: OrderLineItem[];
  subtotalPrice: Money;
  totalShippingPrice: Money;
  totalTax: Money;
  totalPrice: Money;
  taxesIncluded: boolean;
  financialStatus: "PAID";
  /** Reference returned by the payment gateway. Never card data. */
  paymentReference: string;
}

export type ProductSortKey = "featured" | "price-asc" | "price-desc" | "newest" | "title";

export interface ProductQuery {
  search?: string;
  collection?: string;
  tag?: string;
  inStockOnly?: boolean;
  sort?: ProductSortKey;
}

export interface CreateOrderInput {
  cartId: string;
  paymentReference: string;
}
