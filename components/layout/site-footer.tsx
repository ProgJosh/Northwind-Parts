import Link from "next/link";
import { LogoMark } from "./logo";

const LINKS = [
  { href: "/products", label: "All parts" },
  { href: "/cart", label: "Cart" },
  { href: "/admin", label: "Demo admin" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-ink text-paper">
      <div className="page-width grid gap-8 py-10 md:grid-cols-[1fr_auto]">
        <div className="max-w-xl space-y-3">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-8 text-paper [&_path:first-of-type]:fill-ink" />
            <span className="font-display uppercase">Northwind Parts</span>
          </div>
          <p className="text-sm text-paper/75">
            Northwind Parts is a fictional store, built to demonstrate an e-commerce prototype. Its products, prices,
            stock, orders, and payments are all simulated. Nothing is sold, charged, or shipped.
          </p>
          <p className="text-xs text-paper/60">Product illustrations are original artwork made for this demo.</p>
        </div>
        <nav aria-label="Footer">
          <ul role="list" className="flex flex-wrap gap-x-6 gap-y-2 text-sm md:flex-col">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-paper/85 underline-offset-4 hover:text-paper hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
