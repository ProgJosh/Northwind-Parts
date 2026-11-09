import Link from "next/link";
import { CheckIcon } from "@/components/ui/icons";

const STEPS = [
  { label: "Cart", href: "/cart" },
  { label: "Details", href: "/checkout" },
  { label: "Payment", href: "/checkout/payment" },
  { label: "Confirmation", href: null },
] as const;

/** Checkout progress. `current` is the index of the active step (1 = Details, 2 = Payment). */
export function CheckoutSteps({ current }: { current: 1 | 2 }) {
  return (
    <nav aria-label="Checkout steps" className="mb-8">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        {STEPS.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const marker = (
            <span
              aria-hidden="true"
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done ? "bg-ok text-white" : active ? "bg-ink text-paper" : "border border-line text-ink-soft"
              }`}
            >
              {done ? <CheckIcon width={14} height={14} strokeWidth={3} /> : index + 1}
            </span>
          );
          return (
            <li key={step.label} className="flex items-center gap-2">
              {done && step.href ? (
                <Link href={step.href} className="flex items-center gap-2 text-ink-soft hover:text-ink hover:underline">
                  {marker}
                  {step.label}
                  <span className="sr-only">(completed)</span>
                </Link>
              ) : (
                <span
                  aria-current={active ? "step" : undefined}
                  className={`flex items-center gap-2 ${active ? "font-semibold" : "text-ink-soft"}`}
                >
                  {marker}
                  {step.label}
                </span>
              )}
              {index < STEPS.length - 1 && <span aria-hidden="true" className="h-px w-4 bg-line sm:w-8" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
