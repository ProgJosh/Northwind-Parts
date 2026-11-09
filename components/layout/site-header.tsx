import Form from "next/form";
import { Suspense } from "react";
import { SearchIcon } from "@/components/ui/icons";
import { CartButton } from "./cart-button";
import { CollectionNav, CollectionNavFallback } from "./collection-nav";
import { Logo } from "./logo";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="page-width flex flex-wrap items-center gap-x-4 gap-y-3 py-3 sm:flex-nowrap">
        <Logo />
        <Form
          action="/products"
          role="search"
          className="order-last flex w-full items-center gap-2 rounded-md border border-line bg-card pl-3 focus-within:border-fjord sm:order-none sm:ml-auto sm:max-w-sm"
        >
          <SearchIcon className="shrink-0 text-ink-soft" />
          <label htmlFor="site-search" className="sr-only">
            Search parts
          </label>
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder="Search tyres, chains, lights…"
            className="min-h-11 w-full min-w-0 bg-transparent pr-3 text-base outline-none placeholder:text-ink-soft/70"
          />
        </Form>
        <div className="ml-auto sm:ml-0">
          <CartButton />
        </div>
      </div>
      <nav aria-label="Categories" className="border-t border-line">
        <div className="page-width">
          <Suspense fallback={<CollectionNavFallback />}>
            <CollectionNav />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
