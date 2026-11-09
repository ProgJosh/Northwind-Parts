"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/notice";
import {
  detailsFromIdentity,
  SHIPPING_COUNTRIES,
  toBuyerIdentity,
  validateDetails,
  type DetailsErrors,
  type DetailsForm as DetailsValues,
} from "@/lib/checkout/details";
import { formatMoney } from "@/lib/commerce/money";
import { useCart } from "@/lib/commerce/react/cart-provider";
import type { Cart } from "@/lib/commerce/types";
import { CheckoutLayout, CheckoutSkeleton, EmptyCheckout } from "./checkout-shared";

/** Checkout step 1: contact details, delivery address, and delivery method. */
export function CheckoutDetails() {
  const { cart } = useCart();
  if (cart === undefined) return <CheckoutSkeleton />;
  if (!cart || cart.lines.length === 0) return <EmptyCheckout />;
  return (
    <CheckoutLayout cart={cart}>
      <DetailsForm key={cart.id} cart={cart} />
    </CheckoutLayout>
  );
}

function DetailsForm({ cart }: { cart: Cart }) {
  const router = useRouter();
  const { saveBuyerIdentity, selectDeliveryOption } = useCart();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<DetailsValues>(() => detailsFromIdentity(cart.buyerIdentity));
  const [errors, setErrors] = useState<DetailsErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [changingDelivery, startChangingDelivery] = useTransition();

  const field = (name: keyof DetailsValues) => ({
    value: form[name],
    error: errors[name],
    onValueChange: (value: string) => {
      setForm((current) => ({ ...current, [name]: value }));
      if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateDetails(form);
    flushSync(() => {
      setErrors(found);
      setSubmitError(null);
    });
    if (Object.keys(found).length > 0) {
      formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    startSaving(async () => {
      const result = await saveBuyerIdentity(toBuyerIdentity(form));
      if (result.ok) router.push("/checkout/payment");
      else setSubmitError(result.error);
    });
  };

  const chooseDelivery = (handle: string) =>
    startChangingDelivery(async () => {
      const result = await selectDeliveryOption(handle);
      if (!result.ok) setSubmitError(result.error);
    });

  return (
    <form ref={formRef} noValidate onSubmit={submit} className="space-y-8" aria-busy={saving}>
      <section aria-labelledby="contact-heading" className="space-y-4">
        <h2 id="contact-heading" className="font-display text-xl">
          Contact
        </h2>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          hint="A real store would send your receipt here. This demo sends nothing."
          {...field("email")}
        />
      </section>

      <section aria-labelledby="address-heading" className="space-y-4">
        <h2 id="address-heading" className="font-display text-xl">
          Delivery address
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="First name" autoComplete="given-name" {...field("firstName")} />
          <TextField label="Last name" autoComplete="family-name" {...field("lastName")} />
          <TextField
            label="Street and house number"
            autoComplete="address-line1"
            className="sm:col-span-2"
            {...field("address1")}
          />
          <TextField
            label="Apartment, floor, or c/o"
            optional
            autoComplete="address-line2"
            className="sm:col-span-2"
            {...field("address2")}
          />
          <TextField label="Postcode" autoComplete="postal-code" inputMode="numeric" maxLength={4} {...field("zip")} />
          <TextField label="Town or city" autoComplete="address-level2" {...field("city")} />
          <SelectField label="Country" autoComplete="country" className="sm:col-span-2" {...field("countryCode")}>
            {SHIPPING_COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Phone"
            optional
            type="tel"
            autoComplete="tel"
            className="sm:col-span-2"
            hint="Only used by the courier for delivery questions."
            {...field("phone")}
          />
        </div>
      </section>

      <section aria-labelledby="delivery-heading" className="space-y-4">
        <h2 id="delivery-heading" className="font-display text-xl">
          Delivery method
        </h2>
        {cart.deliveryOptions.length === 0 ? (
          <p className="text-sm text-ink-soft">You will choose a delivery method in the secure checkout.</p>
        ) : (
          <fieldset disabled={changingDelivery} className="space-y-3">
            <legend className="sr-only">Delivery method</legend>
            {cart.deliveryOptions.map((option) => (
              <label
                key={option.handle}
                className="flex items-center gap-3 rounded-md border border-line bg-card p-4 has-checked:border-ink has-checked:ring-1 has-checked:ring-ink"
              >
                <input
                  type="radio"
                  name="delivery"
                  value={option.handle}
                  checked={cart.selectedDeliveryOptionHandle === option.handle}
                  onChange={() => chooseDelivery(option.handle)}
                  className="size-5 shrink-0 accent-ink"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{option.title}</span>
                  <span className="block text-sm text-ink-soft">{option.description}</span>
                </span>
                <span className="font-semibold tabular-nums">
                  {option.estimatedCost.amountMinor === 0 ? "Free" : formatMoney(option.estimatedCost)}
                </span>
              </label>
            ))}
          </fieldset>
        )}
      </section>

      {submitError && <Notice tone="error" role="alert" title={submitError} />}

      <div className="flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline">
          <ArrowLeftIcon width={16} height={16} />
          Back to cart
        </Link>
        <Button type="submit" variant="accent" size="lg" disabled={saving || changingDelivery}>
          {saving ? "Saving…" : "Continue to payment"}
        </Button>
      </div>
    </form>
  );
}
