import { useId, type ComponentProps, type ReactNode } from "react";

const CONTROL =
  "block w-full min-h-11 rounded-md border bg-card px-3 text-base text-ink placeholder:text-ink-soft/70 aria-[invalid=true]:border-bad aria-[invalid=true]:bg-bad-soft/40";

interface FieldShellProps {
  id: string;
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}

function FieldShell({ id, label, optional, hint, error, className = "", children }: FieldShellProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
        {optional && <span className="font-normal text-ink-soft"> (optional)</span>}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint: unknown, error: unknown): string | undefined {
  const ids = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

type InputProps = Omit<ComponentProps<"input">, "onChange" | "value" | "id"> & {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
};

export function TextField({ label, value, onValueChange, optional, hint, error, className, ...props }: InputProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={error} className={className}>
      <input
        id={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${CONTROL} border-line`}
        {...props}
      />
    </FieldShell>
  );
}

type SelectProps = Omit<ComponentProps<"select">, "onChange" | "value" | "id"> & {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
};

export function SelectField({ label, value, onValueChange, error, hint, className, children, ...props }: SelectProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <select
        id={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${CONTROL} border-line pr-8`}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}
