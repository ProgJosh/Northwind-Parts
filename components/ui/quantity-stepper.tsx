import { MinusIcon, PlusIcon } from "./icons";

interface QuantityStepperProps {
  value: number;
  max: number;
  min?: number;
  /** What is being counted, e.g. "Ridge Trail Tyre (29 × 2.4)". */
  itemLabel: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Allow typing a number; otherwise only the buttons change it. */
  editable?: boolean;
}

export function QuantityStepper({
  value,
  max,
  min = 1,
  itemLabel,
  onChange,
  disabled = false,
  editable = true,
}: QuantityStepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const buttonClass =
    "flex w-11 items-center justify-center text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <div className="inline-flex h-11 items-stretch overflow-hidden rounded-md border border-line bg-card">
      <button
        type="button"
        className={buttonClass}
        aria-label={`Decrease quantity of ${itemLabel}`}
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        <MinusIcon width={16} height={16} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={`Quantity of ${itemLabel}`}
        min={min}
        max={max}
        value={value}
        readOnly={!editable}
        disabled={disabled}
        onChange={(event) => {
          const next = Math.trunc(Number(event.target.value));
          if (Number.isFinite(next)) onChange(clamp(next));
        }}
        className="w-12 border-x border-line bg-transparent text-center text-base font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        className={buttonClass}
        aria-label={`Increase quantity of ${itemLabel}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
      >
        <PlusIcon width={16} height={16} />
      </button>
    </div>
  );
}
