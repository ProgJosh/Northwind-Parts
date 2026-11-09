import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "accent" | "secondary";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-fjord",
  accent: "bg-signal text-white hover:bg-signal-dark",
  secondary: "border border-ink/70 bg-card text-ink hover:bg-ink/5",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-6 text-base",
};

interface ButtonStyle {
  variant?: Variant;
  size?: Size;
  className?: string;
}

export function buttonClasses({ variant = "primary", size = "md", className = "" }: ButtonStyle = {}): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim();
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & ButtonStyle) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & ButtonStyle) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
