import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingRegion, Skeleton } from "@/components/ui/states";
import type { Cart } from "@/lib/commerce/types";
import { CheckoutSummary } from "./checkout-summary";

/** Form column plus order summary. The summary comes first in the DOM so phones show it on top. */
export function CheckoutLayout({ cart, children }: { cart: Cart; children: ReactNode }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="lg:col-start-2 lg:row-start-1">
        <CheckoutSummary cart={cart} />
      </div>
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">{children}</div>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <LoadingRegion label="Loading checkout">
      <div aria-hidden="true" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </LoadingRegion>
  );
}

export function EmptyCheckout() {
  return (
    <EmptyState title="Your cart is empty" action={<ButtonLink href="/products">Browse parts</ButtonLink>}>
      There is nothing to check out yet.
    </EmptyState>
  );
}
