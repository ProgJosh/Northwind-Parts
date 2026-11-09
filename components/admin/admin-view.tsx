"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { StockBadge } from "@/components/product/stock-badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from "@/components/ui/states";
import { DISPLAY_LOCALE, formatMoney, money } from "@/lib/commerce/money";
import { useCart } from "@/lib/commerce/react/cart-provider";
import { useStore } from "@/lib/commerce/react/store-provider";
import { useStoreQuery } from "@/lib/commerce/react/use-store-query";
import { variantStockStatus } from "@/lib/commerce/stock";
import type { Order, Product } from "@/lib/commerce/types";
import { isDefaultVariantTitle } from "@/lib/commerce/variants";

const TABLE_WRAP = "overflow-x-auto rounded-lg border border-line bg-card";
const TH = "eyebrow whitespace-nowrap px-4 py-3 text-left font-medium";
const TD = "px-4 py-3 align-top";

export function AdminView() {
  const store = useStore();
  const { clear } = useCart();
  const orders = useStoreQuery("admin:orders", (adapter) => adapter.getOrders());
  const products = useStoreQuery("admin:products", (adapter) => adapter.getProducts());
  const [confirming, setConfirming] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [resetting, startReset] = useTransition();

  const reset = () =>
    startReset(async () => {
      await store.resetDemoData?.();
      clear();
      setConfirming(false);
      setResetDone(true);
      orders.reload();
      products.reload();
    });

  return (
    <div className="space-y-10">
      {orders.status === "success" && products.status === "success" && (
        <Stats orders={orders.data} products={products.data} />
      )}

      <section aria-labelledby="orders-heading" className="space-y-4">
        <h2 id="orders-heading" className="font-display text-xl">
          Orders
        </h2>
        {orders.status === "loading" && <TableSkeleton label="Loading orders" />}
        {orders.status === "error" && <Notice tone="info" title={orders.error} />}
        {orders.status === "success" &&
          (orders.data.length === 0 ? (
            <EmptyState title="No demo orders yet">
              Check out with a test card and the order will appear here.
            </EmptyState>
          ) : (
            <OrdersTable orders={orders.data} />
          ))}
      </section>

      <section aria-labelledby="stock-heading" className="space-y-4">
        <h2 id="stock-heading" className="font-display text-xl">
          Stock
        </h2>
        {products.status === "loading" && <TableSkeleton label="Loading stock" />}
        {products.status === "error" && <ErrorState message={products.error} onRetry={products.reload} />}
        {products.status === "success" && <StockTable products={products.data} />}
      </section>

      {store.resetDemoData && (
        <section aria-labelledby="reset-heading" className="space-y-3 rounded-lg border border-line bg-card p-5">
          <h2 id="reset-heading" className="font-display text-lg">
            Reset the demo
          </h2>
          <p className="text-sm text-ink-soft">
            Restores the seeded stock and deletes this browser&apos;s demo carts and orders.
          </p>
          <div aria-live="polite">
            {resetDone && <Notice tone="success" title="The demo store was reset." />}
          </div>
          {confirming ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="accent" onClick={reset} disabled={resetting}>
                {resetting ? "Resetting…" : "Yes, reset everything"}
              </Button>
              <Button variant="secondary" onClick={() => setConfirming(false)} disabled={resetting}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                setConfirming(true);
                setResetDone(false);
              }}
            >
              Reset demo data
            </Button>
          )}
        </section>
      )}
    </div>
  );
}

function Stats({ orders, products }: { orders: Order[]; products: Product[] }) {
  const currencyCode = products[0]?.priceRange.minVariantPrice.currencyCode ?? "CHF";
  const revenue = money(
    orders.reduce((total, order) => total + order.totalPrice.amountMinor, 0),
    currencyCode,
  );
  const unitsSold = orders.reduce(
    (total, order) => total + order.lineItems.reduce((sum, item) => sum + item.quantity, 0),
    0,
  );
  const variants = products.flatMap((product) => product.variants);
  const lowOrOut = variants.filter((variant) => variantStockStatus(variant) !== "in-stock").length;
  const stats = [
    { label: "Demo orders", value: String(orders.length) },
    { label: "Units sold", value: String(unitsSold) },
    { label: "Simulated revenue", value: formatMoney(revenue) },
    { label: "Low or sold out", value: `${lowOrOut} of ${variants.length}` },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border border-line bg-card p-4">
          <dt className="eyebrow">{stat.label}</dt>
          <dd className="mt-1 font-display text-2xl tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function OrdersTable({ orders }: { orders: Order[] }) {
  const dateFormat = new Intl.DateTimeFormat(DISPLAY_LOCALE, { dateStyle: "medium", timeStyle: "short" });
  return (
    <div className={TABLE_WRAP}>
      <table className="w-full min-w-[40rem] text-sm">
        <caption className="sr-only">Demo orders placed in this browser, newest first</caption>
        <thead className="border-b border-line">
          <tr>
            <th scope="col" className={TH}>Order</th>
            <th scope="col" className={TH}>Placed</th>
            <th scope="col" className={TH}>Customer</th>
            <th scope="col" className={`${TH} text-right`}>Items</th>
            <th scope="col" className={`${TH} text-right`}>Total</th>
            <th scope="col" className={TH}>Payment</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className={TD}>
                <Link href={`/orders/${encodeURIComponent(order.id)}`} className="font-semibold underline underline-offset-4">
                  {order.name}
                </Link>
              </td>
              <td className={`${TD} whitespace-nowrap`}>{dateFormat.format(new Date(order.processedAt))}</td>
              <td className={TD}>
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                <span className="block text-xs text-ink-soft">
                  {order.shippingAddress.zip} {order.shippingAddress.city}
                </span>
              </td>
              <td className={`${TD} text-right tabular-nums`}>
                {order.lineItems.reduce((sum, item) => sum + item.quantity, 0)}
              </td>
              <td className={`${TD} text-right font-semibold tabular-nums`}>{formatMoney(order.totalPrice)}</td>
              <td className={TD}>
                <span className="rounded-full bg-ok-soft px-2.5 py-1 text-xs font-semibold text-ok">
                  Paid (simulated)
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StockTable({ products }: { products: Product[] }) {
  return (
    <div className={TABLE_WRAP}>
      <table className="w-full min-w-[40rem] text-sm">
        <caption className="sr-only">Stock per product option</caption>
        <thead className="border-b border-line">
          <tr>
            <th scope="col" className={TH}>Product</th>
            <th scope="col" className={TH}>Option</th>
            <th scope="col" className={TH}>SKU</th>
            <th scope="col" className={`${TH} text-right`}>Available</th>
            <th scope="col" className={TH}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {products.flatMap((product) =>
            product.variants.map((variant) => (
              <tr key={variant.id}>
                <td className={TD}>
                  <Link href={`/products/${product.handle}`} className="hover:underline">
                    {product.title}
                  </Link>
                </td>
                <td className={TD}>{isDefaultVariantTitle(variant.title) ? "n/a" : variant.title}</td>
                <td className={`${TD} whitespace-nowrap font-mono text-xs`}>{variant.sku}</td>
                <td className={`${TD} text-right tabular-nums`}>{variant.quantityAvailable ?? "untracked"}</td>
                <td className={TD}>
                  <StockBadge status={variantStockStatus(variant)} />
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}

function TableSkeleton({ label }: { label: string }) {
  return (
    <LoadingRegion label={label}>
      <div aria-hidden="true" className="space-y-2">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </LoadingRegion>
  );
}
