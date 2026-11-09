import catalogJson from "@/data/catalog.json";
import { money } from "../money";
import type { Collection, Image, Product, ProductVariant } from "../types";
import { optionsFromVariants } from "../variants";

/** Seed data format of `data/catalog.json`. Prices are integer minor units. */
export interface SeedImage {
  url: string;
  altText: string;
  width: number;
  height: number;
}

export interface SeedVariant {
  id: string;
  title: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  /** Units in stock when the demo store is (re)seeded. */
  inventory: number;
  selectedOptions: { name: string; value: string }[];
  /** URL of one of the product's images, shown when this variant is selected. */
  image?: string;
}

export interface SeedProduct {
  id: string;
  handle: string;
  title: string;
  productType: string;
  description: string;
  tags: string[];
  collections: string[];
  publishedAt: string;
  images: SeedImage[];
  variants: SeedVariant[];
}

export interface SeedCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: SeedImage;
}

export interface SeedCatalog {
  vendor: string;
  currencyCode: string;
  collections: SeedCollection[];
  products: SeedProduct[];
}

export const seedCatalog: SeedCatalog = catalogJson;

function toImage(seed: SeedImage): Image {
  return { url: seed.url, altText: seed.altText, width: seed.width, height: seed.height };
}

function buildVariant(
  seed: SeedVariant,
  images: Image[],
  currencyCode: string,
  quantity: number,
): ProductVariant {
  return {
    id: seed.id,
    title: seed.title,
    sku: seed.sku,
    price: money(seed.price, currencyCode),
    compareAtPrice: seed.compareAtPrice === null ? null : money(seed.compareAtPrice, currencyCode),
    availableForSale: quantity > 0,
    quantityAvailable: Math.max(0, quantity),
    selectedOptions: seed.selectedOptions.map((option) => ({ ...option })),
    image: images.find((image) => image.url === seed.image) ?? null,
  };
}

/** Builds a Shopify-shaped product from seed data and the current stock levels. */
export function buildProduct(
  seed: SeedProduct,
  catalog: SeedCatalog,
  inventory: Readonly<Record<string, number>>,
): Product {
  const images = seed.images.map(toImage);
  const variants = seed.variants.map((variant) =>
    buildVariant(variant, images, catalog.currencyCode, inventory[variant.id] ?? 0),
  );
  const prices = variants.map((variant) => variant.price.amountMinor);
  return {
    id: seed.id,
    handle: seed.handle,
    title: seed.title,
    vendor: catalog.vendor,
    productType: seed.productType,
    description: seed.description,
    tags: [...seed.tags],
    collectionHandles: [...seed.collections],
    publishedAt: seed.publishedAt,
    featuredImage: images[0] ?? null,
    images,
    options: optionsFromVariants(variants),
    variants,
    priceRange: {
      minVariantPrice: money(Math.min(...prices), catalog.currencyCode),
      maxVariantPrice: money(Math.max(...prices), catalog.currencyCode),
    },
    availableForSale: variants.some((variant) => variant.availableForSale),
  };
}

export function buildCollection(seed: SeedCollection): Collection {
  return {
    id: seed.id,
    handle: seed.handle,
    title: seed.title,
    description: seed.description,
    image: toImage(seed.image),
  };
}
