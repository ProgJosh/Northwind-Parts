"use client";

import { Totals } from "@/components/cart/totals";
import { DemoNotice } from "@/components/layout/demo-banner";
import { ProductImage } from "@/components/product/product-image";
import { ButtonLink } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from "@/components/ui/states";
import { DISPLAY_LOCALE, formatMoney } from "@/lib/commerce/money";
import { useStoreQuery } from "@/lib/commerce/react/use-store-query";
import type { Order } from "@/lib/commerce/types";
import { isDefaultVariantTitle } from "@/lib/commerce/variants";

export function OrderSkeleton() {
  return (
    <LoadingRegion label="Loading your order">
      <div aria-hidden="true" className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="mx-auto size-14 rounded-full" />
        <Skeleton className="mx-auto h-9 w-2/3" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </LoadingRegion>
  );
}

export function OrderConfirmation({ orderId }: { orderId: string }) {
  const query = useStoreQuery(`order:${orderId}`, (store) => store.getOrder(orderId));

  if (query.status === "loading") return <OrderSkeleton />;
  if (query.status === "error") return <ErrorState message={query.error} onRetry={query.reload} />;
  if (!query.data) {
    return (
      <EmptyState title="Order not found" action={<ButtonLink href="/products">Continue shopping</ButtonLink>}>
        Demo orders are saved only in the browser that placed them, and a demo reset deletes them.
      </EmptyState>
    );
  }
  return <OrderDetails order={query.data} />;
}

function OrderDetails({ order }: { order: Order }) {
  const address = order.shippingAddress;
  const placedAt = new Intl.DateTimeFormat(DISPLAY_LOCALE, { dateStyle: "long", timeStyle: "short" }).format(
    new Date(order.processedAt),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-ok text-white">
          <CheckIcon width={30} height={30} strokeWidth={2.5} />
        </span>
        <p className="eyebrow">Demo order {order.name}</p>
        <h1 className="font-display text-3xl sm:text-4xl">Thank you, {address.firstName}!</h1>
        <p className="text-ink-soft">
          Your demo order is confirmed. A real store would now email a receipt to{" "}
          <strong className="break-all text-ink">{order.email}</strong>.
        </p>
      </header>

      <DemoNotice>
        This was a demo order: nothing was charged, no real shop received it, and nothing will ship. The items were
        taken off this browser&apos;s demo stock.
      </DemoNotice>

      <section aria-labelledby="order-items-heading" className="space-y-5 rounded-lg border border-line bg-card p-5">
        <h2 id="order-items-heading" className="font-display text-lg">
          Order {order.name}
        </h2>
        <ul role="list" className="divide-y divide-line">
          {order.lineItems.map((item) => (
            <li key={`${item.sku}-${item.variantTitle}`} className="flex items-center gap-3 py-3">
              <div className="size-14 shrink-0 rounded-md bg-well">
                <ProductImage image={item.image && { ...item.image, altText: "" }} sizes="56px" className="p-1.5" />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold">{item.title}</p>
                <p className="text-ink-soft">
                  {!isDefaultVariantTitle(item.variantTitle) && `${item.variantTitle} · `}
                  {item.quantity} × {formatMoney(item.originalUnitPrice)}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{formatMoney(item.originalTotalPrice)}</p>
            </li>
          ))}
        </ul>
        <Totals
          subtotal={order.subtotalPrice}
          shipping={order.totalShippingPrice}
          shippingLabel={order.shippingLine.title}
          tax={order.totalTax}
          taxesIncluded={order.taxesIncluded}
          total={order.totalPrice}
        />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="order-address-heading" className="rounded-lg border border-line bg-card p-5 text-sm">
          <h2 id="order-address-heading" className="eyebrow mb-2">
            Delivery address
          </h2>
          <address className="not-italic leading-relaxed">
            {address.firstName} {address.lastName}
            <br />
            {address.address1}
            {address.address2 && (
              <>
                <br />
                {address.address2}
              </>
            )}
            <br />
            {address.zip} {address.city}, {address.countryCode}
          </address>
          <p className="mt-2 text-ink-soft">{order.shippingLine.title}</p>
        </section>
        <section aria-labelledby="order-payment-heading" className="rounded-lg border border-line bg-card p-5 text-sm">
          <h2 id="order-payment-heading" className="eyebrow mb-2">
            Payment
          </h2>
          <p>Test card, approved by the fake gateway</p>
          <p className="mt-1 break-all font-mono text-xs text-ink-soft">Reference {order.paymentReference}</p>
          <p className="mt-2 text-ink-soft">Placed {placedAt}</p>
        </section>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href="/products">Continue shopping</ButtonLink>
        <ButtonLink href="/admin" variant="secondary">
          See it in the demo admin
        </ButtonLink>
      </div>
    </div>
  );
}
