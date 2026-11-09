import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderConfirmation, OrderSkeleton } from "@/components/order/order-confirmation";

export const metadata: Metadata = { title: "Order confirmation" };

/** Orders exist only in the visitor's browser, so the id is read at request time inside Suspense. */
export default function OrderPage({ params }: PageProps<"/orders/[id]">) {
  return (
    <div className="page-width py-10 sm:py-14">
      <Suspense fallback={<OrderSkeleton />}>
        <OrderFromParams params={params} />
      </Suspense>
    </div>
  );
}

async function OrderFromParams({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderConfirmation orderId={id} />;
}
