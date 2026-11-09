import { Button } from "@/components/ui/button";
import { TEST_CARDS } from "@/lib/fake-gateway";

/** Documents the fake gateway's test cards, with a shortcut to fill each one in. */
export function TestCards({ onUse, disabled }: { onUse: (cardNumber: string) => void; disabled?: boolean }) {
  return (
    <section aria-labelledby="test-cards-heading" className="rounded-lg border border-dashed border-ink/40 p-5">
      <h3 id="test-cards-heading" className="font-semibold">
        Test cards
      </h3>
      <p className="mt-1 text-sm text-ink-soft">
        Only these numbers are accepted. Use any future expiry date and any 3-digit security code.
      </p>
      <ul role="list" className="mt-4 divide-y divide-line border-y border-line">
        {TEST_CARDS.map((card) => (
          <li key={card.number} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm font-semibold tracking-wide">{card.number}</p>
              <p className="text-sm">
                <span className="font-semibold">{card.label}:</span>{" "}
                <span className="text-ink-soft">{card.result}</span>
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() => onUse(card.number)}
              aria-label={`Use the ${card.label.toLowerCase()} test card`}
            >
              Use
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
