import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { seedCatalog } from "@/lib/commerce/mock/catalog";

const { products, collections } = seedCatalog;
const variants = products.flatMap((product) => product.variants);
const duplicates = (values: string[]) => values.filter((value, index) => values.indexOf(value) !== index);

describe("seed catalog (data/catalog.json)", () => {
  it("uses unique ids, handles, and SKUs", () => {
    expect(duplicates(products.map((product) => product.id))).toEqual([]);
    expect(duplicates(products.map((product) => product.handle))).toEqual([]);
    expect(duplicates(collections.map((collection) => collection.handle))).toEqual([]);
    expect(duplicates(variants.map((variant) => variant.id))).toEqual([]);
    expect(duplicates(variants.map((variant) => variant.sku))).toEqual([]);
  });

  it("puts every product in an existing collection, and every collection has products", () => {
    const handles = new Set(collections.map((collection) => collection.handle));
    for (const product of products) {
      expect(product.collections.length).toBeGreaterThan(0);
      for (const handle of product.collections) expect(handles).toContain(handle);
    }
    for (const collection of collections) {
      expect(products.some((product) => product.collections.includes(collection.handle))).toBe(true);
    }
  });

  it("stores prices and stock as whole numbers", () => {
    for (const variant of variants) {
      expect(Number.isInteger(variant.price) && variant.price > 0).toBe(true);
      expect(Number.isInteger(variant.inventory) && variant.inventory >= 0).toBe(true);
      if (variant.compareAtPrice !== null) expect(variant.compareAtPrice).toBeGreaterThan(variant.price);
    }
  });

  it("gives each variant a unique combination of the product's options", () => {
    for (const product of products) {
      const optionNames = product.variants.map((variant) => variant.selectedOptions.map((option) => option.name).join("|"));
      expect(new Set(optionNames).size).toBe(1);
      const combinations = product.variants.map((variant) =>
        variant.selectedOptions.map((option) => option.value).join("|"),
      );
      expect(duplicates(combinations)).toEqual([]);
    }
  });

  it("points only at images that exist", () => {
    const urls = [
      ...collections.map((collection) => collection.image.url),
      ...products.flatMap((product) => product.images.map((image) => image.url)),
    ];
    for (const url of urls) expect(existsSync(join(process.cwd(), "public", url))).toBe(true);
    for (const product of products) {
      const productImages = product.images.map((image) => image.url);
      for (const variant of product.variants) {
        if (variant.image) expect(productImages).toContain(variant.image);
      }
    }
  });

  it("seeds in-stock, low-stock, and sold-out variants for the demo", () => {
    expect(variants.some((variant) => variant.inventory === 0)).toBe(true);
    expect(variants.some((variant) => variant.inventory > 0 && variant.inventory <= 5)).toBe(true);
    expect(variants.some((variant) => variant.inventory > 5)).toBe(true);
  });
});
