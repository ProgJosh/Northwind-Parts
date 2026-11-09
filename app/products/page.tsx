import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ProductListing } from "@/components/listing/product-listing";
import { ProductGridSkeleton } from "@/components/product/product-grid";

export const metadata: Metadata = { title: "All parts" };

export default function ProductsPage() {
  return (
    <div className="page-width py-8 sm:py-10">
      <PageHeader eyebrow="Shop" title="All parts">
        Search, filter, and sort the whole catalog. Stock levels are live for this browser&apos;s demo store.
      </PageHeader>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductListing />
      </Suspense>
    </div>
  );
}
