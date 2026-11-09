import type { Product } from "@/lib/commerce/types";
import { LoadingRegion, Skeleton } from "@/components/ui/states";
import { ProductCard } from "./product-card";

const GRID = "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul role="list" className={GRID}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <LoadingRegion label="Loading products">
      <ul className={GRID} aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <li key={index} className="overflow-hidden rounded-lg border border-line bg-card">
            <Skeleton className="aspect-square rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </li>
        ))}
      </ul>
    </LoadingRegion>
  );
}
