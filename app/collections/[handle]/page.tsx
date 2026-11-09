import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ProductListing } from "@/components/listing/product-listing";
import { ProductGridSkeleton } from "@/components/product/product-grid";
import { getCollectionHandles, getCollectionSummary } from "@/lib/commerce/catalog-cache";

export async function generateStaticParams() {
  const handles = await getCollectionHandles();
  return handles.map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: PageProps<"/collections/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const collection = await getCollectionSummary(handle);
  return collection
    ? { title: collection.title, description: collection.description }
    : { title: "Category not found" };
}

export default async function CollectionPage({ params }: PageProps<"/collections/[handle]">) {
  const { handle } = await params;
  const collection = await getCollectionSummary(handle);
  if (!collection) notFound();

  return (
    <div className="page-width py-8 sm:py-10">
      <PageHeader eyebrow="Category" title={collection.title}>
        {collection.description}
      </PageHeader>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductListing collection={handle} />
      </Suspense>
    </div>
  );
}
