import type { Product, ProductQuery, ProductSortKey } from "./types";

export const PRODUCT_SORT_OPTIONS: ReadonlyArray<{ value: ProductSortKey; label: string }> = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
  { value: "title", label: "Name: A to Z" },
];

/** Tags used for merchandising rather than filtering. */
const INTERNAL_TAGS = new Set(["featured"]);

const TAG_LABELS: Record<string, string> = { mtb: "Mountain" };

export function isProductSortKey(value: string | null | undefined): value is ProductSortKey {
  return PRODUCT_SORT_OPTIONS.some((option) => option.value === value);
}

export function tagLabel(tag: string): string {
  return TAG_LABELS[tag] ?? tag.charAt(0).toUpperCase() + tag.slice(1);
}

/** Tags shoppers can filter by, in first-seen order. */
export function filterableTags(products: readonly Product[]): string[] {
  const tags = new Set<string>();
  for (const product of products) {
    for (const tag of product.tags) if (!INTERNAL_TAGS.has(tag)) tags.add(tag);
  }
  return [...tags];
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function searchText(product: Product): string {
  return normalize(
    [
      product.title,
      product.productType,
      ...product.tags.map(tagLabel),
      ...product.variants.flatMap((variant) => [
        variant.sku,
        ...variant.selectedOptions.map((option) => option.value),
      ]),
    ].join(" "),
  );
}

function compareProducts(sort: ProductSortKey): ((a: Product, b: Product) => number) | null {
  switch (sort) {
    case "price-asc":
      return (a, b) => a.priceRange.minVariantPrice.amountMinor - b.priceRange.minVariantPrice.amountMinor;
    case "price-desc":
      return (a, b) => b.priceRange.minVariantPrice.amountMinor - a.priceRange.minVariantPrice.amountMinor;
    case "newest":
      return (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    case "title":
      return (a, b) => a.title.localeCompare(b.title, "en");
    case "featured":
      return null; // keep the catalog's own order
  }
}

/** Search, filter, and sort a product list. Every search word must match. */
export function applyProductQuery(products: readonly Product[], query: ProductQuery = {}): Product[] {
  const terms = normalize(query.search ?? "").split(/\s+/).filter(Boolean);
  const matches = products.filter((product) => {
    if (query.collection && !product.collectionHandles.includes(query.collection)) return false;
    if (query.tag && !product.tags.includes(query.tag)) return false;
    if (query.inStockOnly && !product.availableForSale) return false;
    if (terms.length === 0) return true;
    const haystack = searchText(product);
    return terms.every((term) => haystack.includes(term));
  });
  const compare = compareProducts(query.sort ?? "featured");
  return compare ? matches.sort(compare) : matches;
}
