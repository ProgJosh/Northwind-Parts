import type { Metadata } from "next";
import { CheckoutDetails } from "@/components/checkout/checkout-details";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { DemoNotice } from "@/components/layout/demo-banner";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="page-width py-8 sm:py-10">
      <PageHeader title="Checkout" />
      <CheckoutSteps current={1} />
      <div className="mb-8">
        <DemoNotice>
          You are checking out in a demo store. No real order is placed and nothing is charged. The details you enter
          stay in this browser.
        </DemoNotice>
      </div>
      <CheckoutDetails />
    </div>
  );
}
