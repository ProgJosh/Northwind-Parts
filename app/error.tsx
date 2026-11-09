"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="page-width py-16">
      <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
        <h1 className="font-display text-2xl">Something went wrong</h1>
        <p className="text-ink-soft">The demo store hit an unexpected error. Your cart is still saved in this browser.</p>
        <Button onClick={() => retry()}>Try again</Button>
      </div>
    </div>
  );
}
