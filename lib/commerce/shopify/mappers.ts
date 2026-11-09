import { decimalToMinorUnits, money } from "../money";
import type { Cart, Collection, Image, Money, Product, ProductVariant } from "../types";
import { optionsFromVariants } from "../variants";

/** The subset of Storefront API response shapes this app queries. */
export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  sku: string | null;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  selectedOptions: { name: string; value: string }[];
  image: ShopifyImage | null;
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  description: string;
  tags: string[];
  publishedAt: string;
  availableForSale: boolean;
  featuredImage: ShopifyImage | null;
  images: { nodes: ShopifyImage[] };
  priceRange: { minVariantPrice: ShopifyMoney; maxVariantPrice: ShopifyMoney };
  collections: { nodes: { handle: string }[] };
  variants: { nodes: ShopifyVariant[] };
}

export interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ShopifyImage | null;
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  buyerIdentity: { email: string | null; countryCode: string | null };
  cost: { subtotalAmount: ShopifyMoney; totalAmount: ShopifyMoney };
  lines: {
    nodes: {
      id: string;
      quantity: number;
      cost: { amountPerQuantity: ShopifyMoney; totalAmount: ShopifyMoney };
      merchandise: ShopifyVariant & {
        product: { handle: string; title: string; featuredImage: ShopifyImage | null };
      };
    }[];
  };
}

/** Used when Shopify does not report an image's size. */
const FALLBACK_IMAGE_SIZE = 1024;

function toMoney(value: ShopifyMoney): Money {
  return money(decimalToMinorUnits(value.amount, value.currencyCode), value.currencyCode);
}

function toImage(image: ShopifyImage | null, fallbackAlt: string): Image | null {
  if (!image) return null;
  return {
    url: image.url,
    altText: image.altText ?? fallbackAlt,
    width: image.width ?? FALLBACK_IMAGE_SIZE,
    height: image.height ?? FALLBACK_IMAGE_SIZE,
  };
}

function toVariant(variant: ShopifyVariant, productTitle: string): ProductVariant {
  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku ?? "",
    price: toMoney(variant.price),
    compareAtPrice: variant.compareAtPrice ? toMoney(variant.compareAtPrice) : null,
    availableForSale: variant.availableForSale,
    quantityAvailable: variant.quantityAvailable,
    selectedOptions: variant.selectedOptions.map((option) => ({ ...option })),
    image: toImage(variant.image, productTitle),
  };
}

export function toProduct(product: ShopifyProduct): Product {
  const variants = product.variants.nodes.map((variant) => toVariant(variant, product.title));
  const images = product.images.nodes.flatMap((image) => toImage(image, product.title) ?? []);
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    vendor: product.vendor,
    productType: product.productType,
    description: product.description,
    tags: [...product.tags],
    collectionHandles: product.collections.nodes.map((collection) => collection.handle),
    publishedAt: product.publishedAt,
    featuredImage: toImage(product.featuredImage, product.title) ?? images[0] ?? null,
    images,
    // Built from the variants, so it works on every Storefront API version.
    options: optionsFromVariants(variants),
    variants,
    priceRange: {
      minVariantPrice: toMoney(product.priceRange.minVariantPrice),
      maxVariantPrice: toMoney(product.priceRange.maxVariantPrice),
    },
    availableForSale: product.availableForSale,
  };
}

export function toCollection(collection: ShopifyCollection): Collection {
  return {
    id: collection.id,
    handle: collection.handle,
    title: collection.title,
    description: collection.description,
    image: toImage(collection.image, collection.title),
  };
}

/** Shopify works out shipping and tax in its hosted checkout, so both stay unknown here. */
export function toCart(cart: ShopifyCart): Cart {
  const { email, countryCode } = cart.buyerIdentity;
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    totalQuantity: cart.totalQuantity,
    lines: cart.lines.nodes.map((line) => {
      const { product } = line.merchandise;
      const variant = toVariant(line.merchandise, product.title);
      return {
        id: line.id,
        quantity: line.quantity,
        merchandise: {
          ...variant,
          image: variant.image ?? toImage(product.featuredImage, product.title),
          product: { handle: product.handle, title: product.title },
        },
        cost: {
          amountPerQuantity: toMoney(line.cost.amountPerQuantity),
          totalAmount: toMoney(line.cost.totalAmount),
        },
      };
    }),
    buyerIdentity: email ? { email, countryCode: countryCode ?? "", deliveryAddress: null } : null,
    deliveryOptions: [],
    selectedDeliveryOptionHandle: null,
    cost: {
      subtotalAmount: toMoney(cart.cost.subtotalAmount),
      shippingAmount: null,
      totalTaxAmount: null,
      totalAmount: toMoney(cart.cost.totalAmount),
      taxesIncluded: false,
    },
  };
}
