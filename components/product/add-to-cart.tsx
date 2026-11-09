"use client";

import Link from "next/link";
import { useLayoutEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useCart } from "@/lib/commerce/react/cart-provider";
import { maxAddableQuantity, variantStockStatus } from "@/lib/commerce/stock";
import type { Product, ProductVariant } from "@/lib/commerce/types";
import { merchandiseLabel } from "@/lib/commerce/variants";
import { StockBadge } from "./stock-badge";

function stockMessage(variant: ProductVariant): string {
  const left = variant.quantityAvailable;
  switch (variantStockStatus(variant)) {
    case "sold-out":
      return "This option is sold out.";
    case "low-stock":
      return `Only ${left} left.`;
    case "in-stock":
      return left === null ? "Ready to ship." : `${left} in stock, ready to ship.`;
  }
}

export function AddToCart({ product, variant }: { product: Product; variant: ProductVariant | null }) {
  const { quantityInCart, addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  // Drop a stale "Added to cart" message when the page is hidden by a navigation.
  useLayoutEffect(() => () => setFeedback(null), []);

  if (!variant) {
    return <Notice tone="warning" title="This combination is not available. Choose another option." />;
  }

  const label = merchandiseLabel(product.title, variant.title);
  const status = variantStockStatus(variant);
  const inCart = quantityInCart(variant.id);
  const maxAdd = maxAddableQuantity(variant, inCart);
  const amount = Math.min(Math.max(quantity, 1), Math.max(maxAdd, 1));

  const add = () =>
    startTransition(async () => {
      const result = await addItem(variant.id, amount);
      setFeedback(
        result.ok ? { ok: true, text: `Added ${amount} × ${label} to your cart.` } : { ok: false, text: result.error },
      );
      if (result.ok) setQuantity(1);
    });

  return (
    <div className="space-y-4 rounded-lg border border-line bg-card p-4 sm:p-5">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <StockBadge status={status} />
        <span>{stockMessage(variant)}</span>
        {inCart > 0 && <span className="text-ink-soft">{inCart} already in your cart.</span>}
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p aria-hidden="true" className="mb-1.5 text-sm font-semibold">
            Quantity
          </p>
          <QuantityStepper
            value={amount}
            max={Math.max(maxAdd, 1)}
            itemLabel={label}
            onChange={setQuantity}
            disabled={maxAdd === 0 || pending}
          />
        </div>
        <Button
          variant="accent"
          size="lg"
          className="min-w-48 flex-1"
          onClick={add}
          disabled={maxAdd === 0 || pending}
        >
          {status === "sold-out" ? "Sold out" : pending ? "Adding…" : "Add to cart"}
        </Button>
      </div>

      {maxAdd === 0 && status !== "sold-out" && (
        <p className="text-sm text-ink-soft">Your cart already holds all the units we can sell of this option.</p>
      )}

      <div aria-live="polite">
        {feedback &&
          (feedback.ok ? (
            <Notice tone="success" title={feedback.text}>
              <Link href="/cart">View cart</Link> or <Link href="/checkout">check out</Link>
            </Notice>
          ) : (
            <Notice tone="error" title={feedback.text} />
          ))}
      </div>
    </div>
  );
}
