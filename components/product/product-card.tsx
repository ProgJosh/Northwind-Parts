import Link from "next/link";
import { formatMoney } from "@/lib/commerce/money";
import { productStockStatus } from "@/lib/commerce/stock";
import type { Product } from "@/lib/commerce/types";
import { ProductImage } from "./product-image";
import { StockBadge } from "./stock-badge";

/** "3 sizes · 2 sidewalls" for products with real choices. */
function optionSummary(product: Product): string {
  return product.options
    .filter((option) => option.values.length > 1)
    .map((option) => `${option.values.length} ${option.name.toLowerCase()}s`)
    .join(" · ");
}

export function ProductCard({ product }: { product: Product }) {
  const status = productStockStatus(product);
  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const onSale = product.variants.some(
    (variant) => variant.compareAtPrice && variant.compareAtPrice.amountMinor > variant.price.amountMinor,
  );
  const summary = optionSummary(product);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-card transition-shadow hover:shadow-[0_8px_28px_-14px_rgb(20_35_43/0.45)] has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-fjord">
      <div className="relative aspect-square bg-well">
        <ProductImage
          image={product.featuredImage}
          sizes="(min-width: 1024px) 18rem, (min-width: 768px) 33vw, 50vw"
          className="transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none"
        />
        {(status !== "in-stock" || onSale) && (
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1 sm:left-3 sm:top-3">
            {status !== "in-stock" && <StockBadge status={status} />}
            {onSale && status !== "sold-out" && (
              <span className="rounded-full bg-signal px-2.5 py-1 text-xs font-semibold text-white">Sale</span>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <p className="eyebrow">{product.productType}</p>
        <h3 className="font-semibold leading-snug">
          <Link href={`/products/${product.handle}`} className="outline-none after:absolute after:inset-0">
            {product.title}
          </Link>
        </h3>
        {summary && <p className="text-xs text-ink-soft">{summary}</p>}
        <p className="mt-auto pt-2 font-semibold tabular-nums">
          {minVariantPrice.amountMinor === maxVariantPrice.amountMinor
            ? formatMoney(minVariantPrice)
            : `From ${formatMoney(minVariantPrice)}`}
        </p>
      </div>
    </article>
  );
}
