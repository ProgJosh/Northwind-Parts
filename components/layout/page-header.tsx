import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 space-y-2">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="font-display text-3xl leading-tight sm:text-4xl">{title}</h1>
      {children && <div className="max-w-2xl text-ink-soft">{children}</div>}
    </header>
  );
}
