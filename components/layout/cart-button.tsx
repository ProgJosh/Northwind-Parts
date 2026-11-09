"use client";

import Link from "next/link";
import { CartIcon } from "@/components/ui/icons";
import { useCart } from "@/lib/commerce/react/cart-provider";

export function CartButton() {
  const { cart } = useCart();
  const count = cart?.totalQuantity ?? 0;
  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-line bg-card px-3 text-sm font-semibold transition-colors hover:border-ink/60"
    >
      <CartIcon />
      <span className="hidden sm:inline">Cart</span>
      {cart !== undefined && (
        <span className="min-w-6 rounded-full bg-ink px-1.5 py-0.5 text-center text-xs tabular-nums text-paper">
          {count}
        </span>
      )}
    </Link>
  );
}
