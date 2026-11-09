import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductSkeleton, ProductView } from "@/components/product/product-view";
import { getProductHandles, getProductSummary } from "@/lib/commerce/catalog-cache";

export async function generateStaticParams() {
  const handles = await getProductHandles();
  return handles.map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: PageProps<"/products/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductSummary(handle);
  return product ? { title: product.title, description: product.description } : { title: "Part not found" };
}

export default async function ProductPage({ params }: PageProps<"/products/[handle]">) {
  const { handle } = await params;
  if (!(await getProductSummary(handle))) notFound();

  return (
    <div className="page-width py-8 sm:py-10">
      {/* Product data, stock, and cart state load in the browser through the store adapter. */}
      <Suspense fallback={<ProductSkeleton />}>
        <ProductView handle={handle} />
      </Suspense>
    </div>
  );
}
