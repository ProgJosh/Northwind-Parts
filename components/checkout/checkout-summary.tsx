import { CartTotals } from "@/components/cart/totals";
import { ProductImage } from "@/components/product/product-image";
import { ChevronRightIcon } from "@/components/ui/icons";
import { formatMoney } from "@/lib/commerce/money";
import type { Cart } from "@/lib/commerce/types";
import { isDefaultVariantTitle } from "@/lib/commerce/variants";

function SummaryLines({ cart }: { cart: Cart }) {
  return (
    <ul role="list" className="space-y-4">
      {cart.lines.map((line) => (
        <li key={line.id} className="flex items-center gap-3">
          <div className="relative size-14 shrink-0 rounded-md bg-well">
            <ProductImage
              image={line.merchandise.image && { ...line.merchandise.image, altText: "" }}
              sizes="56px"
              className="rounded-md"
            />
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-paper"
            >
              {line.quantity}
            </span>
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold leading-snug">{line.merchandise.product.title}</p>
            {!isDefaultVariantTitle(line.merchandise.title) && (
              <p className="text-ink-soft">{line.merchandise.title}</p>
            )}
            <p className="sr-only">Quantity {line.quantity}</p>
          </div>
          <p className="text-sm font-semibold tabular-nums">{formatMoney(line.cost.totalAmount)}</p>
        </li>
      ))}
    </ul>
  );
}

/** Order summary: collapsible on phones, always open beside the form on desktop. */
export function CheckoutSummary({ cart }: { cart: Cart }) {
  return (
    <aside aria-label="Order summary" className="rounded-lg border border-line bg-card p-5 lg:sticky lg:top-6">
      <details className="group lg:hidden">
        <summary className="flex list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <ChevronRightIcon width={16} height={16} className="transition-transform group-open:rotate-90" />
            Order summary
          </span>
          <span className="tabular-nums">{formatMoney(cart.cost.totalAmount)}</span>
        </summary>
        <div className="mt-5 space-y-5">
          <SummaryLines cart={cart} />
          <CartTotals cart={cart} />
        </div>
      </details>
      <div className="hidden space-y-5 lg:block">
        <h2 className="font-display text-lg">Order summary</h2>
        <SummaryLines cart={cart} />
        <CartTotals cart={cart} />
      </div>
    </aside>
  );
}
