import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="page-width py-8 sm:py-10">
      <PageHeader eyebrow="Shopping" title="Your cart" />
      <CartView />
    </div>
  );
}
