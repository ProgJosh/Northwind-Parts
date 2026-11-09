import type { Product, ProductOption, ProductVariant, SelectedOption } from "./types";

/** Shopify names the only variant of a single-variant product "Default Title". */
export function isDefaultVariantTitle(title: string): boolean {
  return title === "Default Title";
}

export function hasOnlyDefaultVariant(product: Pick<Product, "variants">): boolean {
  return product.variants.length === 1 && isDefaultVariantTitle(product.variants[0].title);
}

/** "Ridge Trail Tyre (29 × 2.4)", or just the product title for single-variant products. */
export function merchandiseLabel(productTitle: string, variantTitle: string): string {
  return isDefaultVariantTitle(variantTitle) ? productTitle : `${productTitle} (${variantTitle})`;
}

/** Product options in first-seen order, derived from the variants' selected options. */
export function optionsFromVariants(
  variants: ReadonlyArray<{ selectedOptions: SelectedOption[] }>,
): ProductOption[] {
  const options = new Map<string, string[]>();
  for (const variant of variants) {
    for (const { name, value } of variant.selectedOptions) {
      const values = options.get(name) ?? [];
      if (!values.includes(value)) values.push(value);
      options.set(name, values);
    }
  }
  return [...options].map(([name, values]) => ({ name, values }));
}

/** The variant whose options match every entry in `selection`, if one exists. */
export function findVariant(
  product: Pick<Product, "variants">,
  selection: Readonly<Record<string, string>>,
): ProductVariant | undefined {
  return product.variants.find((variant) =>
    variant.selectedOptions.every((option) => selection[option.name] === option.value),
  );
}

export function selectionOf(variant: ProductVariant): Record<string, string> {
  return Object.fromEntries(variant.selectedOptions.map((option) => [option.name, option.value]));
}
