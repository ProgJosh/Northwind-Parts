import type { Metadata } from "next";
import { CheckoutPayment } from "@/components/checkout/checkout-payment";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Payment" };

export default function PaymentPage() {
  return (
    <div className="page-width py-8 sm:py-10">
      <PageHeader title="Checkout" />
      <CheckoutSteps current={2} />
      <CheckoutPayment />
    </div>
  );
}
