import type { Product } from "@/lib/commerce/types";
import { findVariant } from "@/lib/commerce/variants";

interface VariantPickerProps {
  product: Product;
  selection: Record<string, string>;
  onSelect: (optionName: string, value: string) => void;
}

/** One radio group per product option. Sold-out choices stay selectable but are struck through. */
export function VariantPicker({ product, selection, onSelect }: VariantPickerProps) {
  return (
    <div className="space-y-5">
      {product.options.map((option) => (
        <fieldset key={option.name}>
          <legend className="mb-2 text-sm font-semibold">
            {option.name}: <span className="font-normal text-ink-soft">{selection[option.name]}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const candidate = findVariant(product, { ...selection, [option.name]: value });
              const soldOut = !candidate?.availableForSale;
              return (
                <label key={value} className="relative">
                  <input
                    type="radio"
                    name={`option-${option.name}`}
                    value={value}
                    aria-label={soldOut ? `${value} (sold out)` : value}
                    checked={selection[option.name] === value}
                    onChange={() => onSelect(option.name, value)}
                    className="peer absolute inset-0 cursor-pointer appearance-none rounded-md"
                  />
                  <span
                    aria-hidden="true"
                    className={`flex min-h-11 items-center rounded-md border border-line bg-card px-4 text-sm font-medium transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-hover:border-ink/60 ${
                      soldOut ? "text-ink-soft line-through decoration-1 peer-checked:text-paper/80" : ""
                    }`}
                  >
                    {value}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
