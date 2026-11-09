"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { EmptyState, LoadingRegion, Skeleton } from "@/components/ui/states";
import { useCart } from "@/lib/commerce/react/cart-provider";
import { CartLineItem, lineStockProblem } from "./cart-line-item";
import { CartTotals } from "./totals";

export function CartView() {
  const { cart } = useCart();

  if (cart === undefined) {
    return (
      <LoadingRegion label="Loading your cart">
        <div aria-hidden="true" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </LoadingRegion>
    );
  }

  if (!cart || cart.lines.length === 0) {
    return (
      <EmptyState title="Your cart is empty" action={<ButtonLink href="/products">Browse parts</ButtonLink>}>
        Add a part or two, then come back here to check out.
      </EmptyState>
    );
  }

  const hasStockProblem = cart.lines.some((line) => lineStockProblem(line) !== null);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <section aria-labelledby="cart-items-heading">
        <h2 id="cart-items-heading" className="sr-only">
          Items in your cart
        </h2>
        <ul role="list" className="divide-y divide-line border-y border-line">
          {cart.lines.map((line) => (
            <CartLineItem key={line.id} line={line} />
          ))}
        </ul>
      </section>

      <aside
        aria-labelledby="cart-summary-heading"
        className="space-y-5 rounded-lg border border-line bg-card p-5 lg:sticky lg:top-6"
      >
        <h2 id="cart-summary-heading" className="font-display text-lg">
          Order summary
        </h2>
        <CartTotals cart={cart} />
        {hasStockProblem ? (
          <>
            <Notice tone="warning" title="Some items have less stock than your cart holds.">
              Lower those quantities to continue to checkout.
            </Notice>
            <Button variant="accent" size="lg" className="w-full" disabled>
              Check out
            </Button>
          </>
        ) : (
          <ButtonLink href="/checkout" variant="accent" size="lg" className="w-full">
            Check out
          </ButtonLink>
        )}
        <p className="text-xs text-ink-soft">
          Demo checkout: payment runs through a fake gateway that only accepts test cards. Nothing is charged.
        </p>
      </aside>
    </div>
  );
}
