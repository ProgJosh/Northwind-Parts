import type { ReactNode } from "react";

/** Shown at the top of every page: this store takes no real orders or payments. */
export function DemoBanner() {
  return (
    <div role="note" aria-label="Demo notice" className="hazard-stripes px-4 py-1.5 text-center">
      <p className="inline-block rounded-sm bg-hazard px-3 py-0.5 font-mono text-xs font-semibold tracking-[0.02em] text-ink sm:tracking-[0.08em]">
        DEMO STORE – no real orders or payments
      </p>
    </div>
  );
}

/** The same note, expanded, for the checkout and order-confirmation pages. */
export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <aside aria-label="Demo notice" className="overflow-hidden rounded-lg border-2 border-ink bg-card">
      <div aria-hidden="true" className="hazard-stripes h-2" />
      <div className="space-y-1 p-4 text-sm">
        <p className="font-mono text-xs font-semibold tracking-[0.04em] text-ink">
          DEMO STORE – no real orders or payments
        </p>
        <div className="text-ink-soft">{children}</div>
      </div>
    </aside>
  );
}
