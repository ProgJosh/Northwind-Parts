"use client";

import Link from "next/link";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { ProductImage } from "@/components/product/product-image";
import { ErrorState, LoadingRegion, Skeleton } from "@/components/ui/states";
import { useStoreQuery } from "@/lib/commerce/react/use-store-query";

export function CollectionTiles() {
  const query = useStoreQuery("collections", (store) => store.getCollections());

  if (query.status === "loading") {
    return (
      <LoadingRegion label="Loading categories">
        <ul aria-hidden="true" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index}>
              <Skeleton className="aspect-[4/5] rounded-lg" />
            </li>
          ))}
        </ul>
      </LoadingRegion>
    );
  }
  if (query.status === "error") return <ErrorState message={query.error} onRetry={query.reload} />;

  return (
    <ul role="list" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
      {query.data.map((collection) => (
        <li key={collection.id}>
          <Link
            href={`/collections/${collection.handle}`}
            className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-card transition-colors hover:border-ink/50"
          >
            <div className="aspect-[4/3] bg-well">
              <ProductImage
                image={collection.image && { ...collection.image, altText: "" }}
                sizes="(min-width: 1024px) 12rem, (min-width: 768px) 33vw, 50vw"
                className="transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
              />
            </div>
            <div className="space-y-1 p-3">
              <p className="font-semibold leading-tight">{collection.title}</p>
              <p className="line-clamp-2 text-xs text-ink-soft">{collection.description}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function FeaturedProducts() {
  const query = useStoreQuery("featured", (store) => store.getProducts({ tag: "featured" }));
  if (query.status === "loading") return <ProductGridSkeleton count={4} />;
  if (query.status === "error") return <ErrorState message={query.error} onRetry={query.reload} />;
  return <ProductGrid products={query.data} />;
}
