import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { DemoBanner } from "@/components/layout/demo-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "./providers";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: {
    default: "Northwind Parts · Demo bike-parts store",
    template: "%s · Northwind Parts (demo)",
  },
  description:
    "A fictional bike-parts shop that demonstrates a Shopify-style storefront. No real products, orders, or payments.",
  // A demo shop should never show up in search results.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#14232b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      <body className="flex min-h-dvh flex-col bg-paper font-sans text-ink antialiased">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-ink px-4 py-2 text-paper focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <Providers>
          <DemoBanner />
          <SiteHeader />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
