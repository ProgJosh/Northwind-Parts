"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStoreQuery } from "@/lib/commerce/react/use-store-query";

const LINK =
  "inline-flex min-h-9 items-center rounded-full px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink aria-[current=page]:bg-ink aria-[current=page]:text-paper";

export function CollectionNav() {
  const pathname = usePathname();
  const query = useStoreQuery("collections", (store) => store.getCollections());
  const collections = query.status === "success" ? query.data : [];
  const links = [
    { href: "/products", label: "All parts" },
    ...collections.map((collection) => ({ href: `/collections/${collection.handle}`, label: collection.title })),
  ];

  return (
    <ul role="list" className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
      {links.map((link) => (
        <li key={link.href} className="shrink-0">
          <Link href={link.href} aria-current={pathname === link.href ? "page" : undefined} className={LINK}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Shown while the current path is unknown (routes whose params are only known at request time). */
export function CollectionNavFallback() {
  return (
    <ul role="list" className="flex gap-1 py-2">
      <li>
        <Link href="/products" className={LINK}>
          All parts
        </Link>
      </li>
    </ul>
  );
}
