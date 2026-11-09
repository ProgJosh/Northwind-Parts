import Link from "next/link";

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <path d="M16 5.5 23.5 25 16 20.8 8.5 25Z" fill="#f4f1ea" />
      <path d="M16 5.5V20.8L8.5 25Z" fill="#f4c430" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-md text-ink" aria-label="Northwind Parts, home">
      <LogoMark className="size-9" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg uppercase">Northwind</span>
        <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-ink-soft">Parts</span>
      </span>
    </Link>
  );
}
