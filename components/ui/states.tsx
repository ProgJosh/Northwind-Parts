import type { ReactNode } from "react";
import { Button } from "./button";
import { AlertIcon } from "./icons";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`rounded-md bg-well motion-safe:animate-pulse ${className}`} />;
}

/** Announces a loading region to assistive tech while skeletons show. */
export function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-label={label}>
      {children}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <AlertIcon width={28} height={28} className="text-bad" />
      <p className="font-semibold">We couldn&apos;t load this part of the store.</p>
      <p className="text-sm text-ink-soft">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-14 text-center">
      <p className="font-display text-xl">{title}</p>
      {children && <div className="text-sm text-ink-soft">{children}</div>}
      {action}
    </div>
  );
}
