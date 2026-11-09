"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { lineStockProblem } from "@/components/cart/cart-line-item";
import { DemoNotice } from "@/components/layout/demo-banner";
import { Button, buttonClasses } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { hasCompleteDetails } from "@/lib/checkout/details";
import { errorMessage } from "@/lib/commerce/adapter";
import { formatMoney } from "@/lib/commerce/money";
import { useCart } from "@/lib/commerce/react/cart-provider";
import { useStore } from "@/lib/commerce/react/store-provider";
import type { Cart } from "@/lib/commerce/types";
import { authorize, validateCard, type CardDetails, type CardErrors } from "@/lib/fake-gateway";
import { CheckoutLayout, CheckoutSkeleton, EmptyCheckout } from "./checkout-shared";
import { TestCards } from "./test-cards";

const EMPTY_CARD: CardDetails = { cardNumber: "", expiry: "", cvc: "" };

/** Checkout step 2: simulated payment (mock store) or a hand-off to the hosted checkout (Shopify). */
export function CheckoutPayment() {
  const store = useStore();
  const router = useRouter();
  const { cart, clear } = useCart();
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  // If the shopper comes back to this page later, show the (now empty) cart state.
  useLayoutEffect(() => () => setPlacedOrderId(null), []);

  if (placedOrderId) {
    return <Notice tone="success" role="status" title="Order placed. Opening your confirmation…" />;
  }
  if (cart === undefined) return <CheckoutSkeleton />;
  if (!cart || cart.lines.length === 0) return <EmptyCheckout />;

  const hosted = store.checkoutMode === "hosted";
  const ready = hosted ? Boolean(cart.buyerIdentity?.email) : hasCompleteDetails(cart.buyerIdentity);

  const handlePlaced = (orderId: string) => {
    setPlacedOrderId(orderId);
    clear();
    router.push(`/orders/${encodeURIComponent(orderId)}`);
  };

  return (
    <CheckoutLayout cart={cart}>
      {!ready ? (
        <Notice tone="warning" title="Add your contact and delivery details first.">
          <Link href="/checkout">Go to the details step</Link>
        </Notice>
      ) : (
        <div className="space-y-8">
          <DetailsRecap cart={cart} />
          {hosted ? <HostedPayment cart={cart} /> : <SimulatedPayment cart={cart} onPlaced={handlePlaced} />}
        </div>
      )}
    </CheckoutLayout>
  );
}

function DetailsRecap({ cart }: { cart: Cart }) {
  const identity = cart.buyerIdentity;
  const address = identity?.deliveryAddress;
  const delivery = cart.deliveryOptions.find((option) => option.handle === cart.selectedDeliveryOptionHandle);
  const rows = [
    { label: "Contact", value: identity?.email },
    address && {
      label: "Ship to",
      value: `${address.firstName} ${address.lastName}, ${address.address1}${address.address2 ? `, ${address.address2}` : ""}, ${address.zip} ${address.city}, ${address.countryCode}`,
    },
    delivery && {
      label: "Delivery",
      value: `${delivery.title} · ${delivery.estimatedCost.amountMinor === 0 ? "Free" : formatMoney(delivery.estimatedCost)}`,
    },
  ].filter((row): row is { label: string; value: string } => Boolean(row && row.value));

  return (
    <dl className="divide-y divide-line rounded-lg border border-line bg-card text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3">
          <dt className="eyebrow w-20 shrink-0">{row.label}</dt>
          <dd className="min-w-0 flex-1 break-words">{row.value}</dd>
          <dd>
            <Link href="/checkout" className="font-semibold underline underline-offset-4">
              Change<span className="sr-only"> {row.label.toLowerCase()}</span>
            </Link>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function futureExpiry(): string {
  return `12/${String((new Date().getFullYear() + 3) % 100).padStart(2, "0")}`;
}

function SimulatedPayment({ cart, onPlaced }: { cart: Cart; onPlaced: (orderId: string) => void }) {
  const store = useStore();
  const formRef = useRef<HTMLFormElement>(null);
  const [card, setCard] = useState<CardDetails>(EMPTY_CARD);
  const [errors, setErrors] = useState<CardErrors>({});
  const [outcome, setOutcome] = useState<string | null>(null);
  const [paying, startPaying] = useTransition();

  // Card fields only ever live in this component's memory; clear them when the page is hidden.
  useLayoutEffect(
    () => () => {
      setCard(EMPTY_CARD);
      setErrors({});
      setOutcome(null);
    },
    [],
  );

  const stockProblem = cart.lines.some((line) => lineStockProblem(line) !== null);
  const total = cart.cost.totalAmount;

  const field = (name: keyof CardDetails) => ({
    value: card[name],
    error: errors[name],
    onValueChange: (value: string) => {
      setCard((current) => ({ ...current, [name]: value }));
      if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
    },
  });

  const fillTestCard = (cardNumber: string) => {
    setCard({ cardNumber, expiry: futureExpiry(), cvc: "123" });
    setErrors({});
    setOutcome(null);
  };

  const pay = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateCard(card);
    flushSync(() => {
      setErrors(found);
      setOutcome(null);
    });
    if (Object.keys(found).length > 0) {
      formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    startPaying(async () => {
      const result = await authorize(card.cardNumber, card.expiry, card.cvc, total);
      if (result.status !== "approved") {
        setOutcome(result.message);
        return;
      }
      try {
        const order = await store.createOrder({ cartId: cart.id, paymentReference: result.authorizationId });
        setCard(EMPTY_CARD);
        onPlaced(order.id);
      } catch (error) {
        setOutcome(`${errorMessage(error)} The test payment was released, so nothing was charged.`);
      }
    });
  };

  // Attributes that keep browsers and password managers from offering saved (real) cards.
  const noAutofill = {
    autoComplete: "off",
    spellCheck: false,
    "data-1p-ignore": true,
    "data-lpignore": "true",
    "data-form-type": "other",
  } as const;

  return (
    <section aria-labelledby="payment-heading" className="space-y-5">
      <h2 id="payment-heading" className="font-display text-xl">
        Payment
      </h2>
      <DemoNotice>
        This is a simulated payment through a fake gateway. Use a test card from the list below and never enter a
        real card. Card details stay on this page: they are not stored, logged, or sent anywhere.
      </DemoNotice>

      {stockProblem && (
        <Notice tone="warning" title="Some items have less stock than your cart holds.">
          <Link href="/cart">Update your cart</Link> before paying.
        </Notice>
      )}

      <form
        ref={formRef}
        noValidate
        onSubmit={pay}
        aria-busy={paying}
        className="space-y-4 rounded-lg border border-line bg-card p-5"
      >
        <TextField
          label="Test card number"
          name="demo-card-number"
          inputMode="numeric"
          placeholder="4242 4242 4242 4242"
          maxLength={23}
          {...noAutofill}
          {...field("cardNumber")}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Expiry (MM/YY)"
            name="demo-card-expiry"
            inputMode="numeric"
            placeholder="12/30"
            maxLength={5}
            {...noAutofill}
            {...field("expiry")}
          />
          <TextField
            label="Security code"
            name="demo-card-code"
            inputMode="numeric"
            placeholder="123"
            maxLength={3}
            {...noAutofill}
            {...field("cvc")}
          />
        </div>

        {outcome && <Notice tone="error" role="alert" title={outcome} />}

        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={paying || stockProblem}>
          {paying ? "Contacting the fake gateway…" : `Pay ${formatMoney(total)} (simulated)`}
        </Button>
        <p className="text-center text-xs text-ink-soft">No money moves. The gateway only pretends to approve.</p>
      </form>

      <TestCards onUse={fillTestCard} disabled={paying} />
    </section>
  );
}

function HostedPayment({ cart }: { cart: Cart }) {
  return (
    <section aria-labelledby="payment-heading" className="space-y-4">
      <h2 id="payment-heading" className="font-display text-xl">
        Payment
      </h2>
      <p className="text-sm text-ink-soft">
        Payment, delivery, and taxes are completed in the store&apos;s hosted checkout.
      </p>
      {cart.checkoutUrl ? (
        <a href={cart.checkoutUrl} className={buttonClasses({ variant: "accent", size: "lg", className: "w-full" })}>
          Continue to secure checkout
        </a>
      ) : (
        <Notice tone="error" title="The store did not return a checkout link. Please try again later." />
      )}
    </section>
  );
}
