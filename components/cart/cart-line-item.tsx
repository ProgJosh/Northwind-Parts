"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ProductImage } from "@/components/product/product-image";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { formatMoney } from "@/lib/commerce/money";
import { useCart } from "@/lib/commerce/react/cart-provider";
import { sellableQuantity } from "@/lib/commerce/stock";
import type { CartLine } from "@/lib/commerce/types";
import { isDefaultVariantTitle, merchandiseLabel } from "@/lib/commerce/variants";

/** Shopper-facing problem when stock fell below the quantity in the cart, otherwise null. */
export function lineStockProblem(line: CartLine): string | null {
  const limit = sellableQuantity(line.merchandise);
  if (line.quantity <= limit) return null;
  return limit === 0
    ? "This item has sold out. Remove it to continue."
    : `Only ${limit} available. Lower the quantity to continue.`;
}

export function CartLineItem({ line }: { line: CartLine }) {
  const { updateLine, removeLine } = useCart();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { merchandise } = line;
  const label = merchandiseLabel(merchandise.product.title, merchandise.title);
  const productHref = `/products/${merchandise.product.handle}`;
  const problem = lineStockProblem(line);

  const changeQuantity = (quantity: number) =>
    startTransition(async () => {
      const result = await updateLine(line.id, quantity);
      setError(result.ok ? null : result.error);
    });

  const remove = () =>
    startTransition(async () => {
      const result = await removeLine(line.id);
      if (!result.ok) setError(result.error);
    });

  return (
    <li className="flex gap-4 py-5" aria-busy={pending}>
      <Link
        href={productHref}
        tabIndex={-1}
        aria-hidden="true"
        className="size-20 shrink-0 overflow-hidden rounded-md bg-well sm:size-24"
      >
        <ProductImage image={merchandise.image && { ...merchandise.image, altText: "" }} sizes="96px" className="p-2" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          <h3 className="font-semibold leading-snug">
            <Link href={productHref} className="hover:underline">
              {merchandise.product.title}
            </Link>
          </h3>
          {!isDefaultVariantTitle(merchandise.title) && <p className="text-sm text-ink-soft">{merchandise.title}</p>}
          <p className="font-mono text-xs text-ink-soft">SKU {merchandise.sku}</p>
          <p className="pt-1 text-sm tabular-nums">{formatMoney(line.cost.amountPerQuantity)} each</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:flex-col sm:items-end">
          <QuantityStepper
            value={line.quantity}
            max={Math.max(line.quantity, sellableQuantity(merchandise))}
            itemLabel={label}
            onChange={changeQuantity}
            disabled={pending}
            editable={false}
          />
          <p className="font-semibold tabular-nums">{formatMoney(line.cost.totalAmount)}</p>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label={`Remove ${label}`}
            className="text-sm text-ink-soft underline underline-offset-4 hover:text-bad"
          >
            Remove
          </button>
        </div>
        {(error ?? problem) && (
          <p role="alert" className="text-sm font-medium text-bad sm:basis-full">
            {error ?? problem}
          </p>
        )}
      </div>
    </li>
  );
}
