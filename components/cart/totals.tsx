import { formatMoney } from "@/lib/commerce/money";
import type { Cart, Money } from "@/lib/commerce/types";

interface TotalsProps {
  subtotal: Money;
  /** Null while shipping is unknown (hosted checkout). */
  shipping: Money | null;
  shippingLabel?: string;
  /** Null while tax is unknown (hosted checkout). */
  tax: Money | null;
  taxesIncluded: boolean;
  total: Money;
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${muted ? "text-ink-soft" : ""}`}>
      <dt>{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </div>
  );
}

export function Totals({ subtotal, shipping, shippingLabel, tax, taxesIncluded, total }: TotalsProps) {
  const shippingValue =
    shipping === null ? "Calculated at checkout" : shipping.amountMinor === 0 ? "Free" : formatMoney(shipping);
  return (
    <dl className="space-y-2.5 text-sm">
      <Row label="Subtotal" value={formatMoney(subtotal)} />
      <Row label={shippingLabel ? `Shipping · ${shippingLabel}` : "Shipping"} value={shippingValue} />
      {tax === null ? (
        <Row label="Taxes" value="Calculated at checkout" muted />
      ) : (
        <Row label={taxesIncluded ? "Included VAT" : "Tax"} value={formatMoney(tax)} muted={taxesIncluded} />
      )}
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3 text-base font-bold">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatMoney(total)}</dd>
      </div>
    </dl>
  );
}

export function CartTotals({ cart }: { cart: Cart }) {
  const delivery = cart.deliveryOptions.find((option) => option.handle === cart.selectedDeliveryOptionHandle);
  return (
    <Totals
      subtotal={cart.cost.subtotalAmount}
      shipping={cart.cost.shippingAmount}
      shippingLabel={delivery?.title}
      tax={cart.cost.totalTaxAmount}
      taxesIncluded={cart.cost.taxesIncluded}
      total={cart.cost.totalAmount}
    />
  );
}
