import type { StockStatus } from "@/lib/commerce/stock";

const STYLES: Record<StockStatus, string> = {
  "in-stock": "bg-ok-soft text-ok",
  "low-stock": "bg-warn-soft text-warn",
  "sold-out": "bg-bad-soft text-bad",
};

const STOCK_LABELS: Record<StockStatus, string> = {
  "in-stock": "In stock",
  "low-stock": "Low stock",
  "sold-out": "Sold out",
};

export function StockBadge({ status }: { status: StockStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {STOCK_LABELS[status]}
    </span>
  );
}
