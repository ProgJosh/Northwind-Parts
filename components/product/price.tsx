import { formatMoney, money } from "@/lib/commerce/money";
import type { Money } from "@/lib/commerce/types";

export function Price({
  price,
  compareAtPrice,
  className = "",
}: {
  price: Money;
  compareAtPrice?: Money | null;
  className?: string;
}) {
  if (!compareAtPrice || compareAtPrice.amountMinor <= price.amountMinor) {
    return <p className={`tabular-nums ${className}`}>{formatMoney(price)}</p>;
  }
  const saving = money(compareAtPrice.amountMinor - price.amountMinor, price.currencyCode);
  return (
    <p className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums ${className}`}>
      <span className="text-signal">
        <span className="sr-only">Sale price </span>
        {formatMoney(price)}
      </span>
      <s className="text-[0.8em] font-normal text-ink-soft">
        <span className="sr-only">Regular price </span>
        {formatMoney(compareAtPrice)}
      </s>
      <span className="self-center rounded-full bg-signal px-2 py-0.5 text-xs font-semibold text-white">
        Save {formatMoney(saving)}
      </span>
    </p>
  );
}
