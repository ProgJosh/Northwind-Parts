"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { filterableTags, isProductSortKey, PRODUCT_SORT_OPTIONS, tagLabel } from "@/lib/commerce/product-query";
import { useStoreQuery } from "@/lib/commerce/react/use-store-query";
import type { ProductQuery } from "@/lib/commerce/types";

/**
 * Search, filter, and sort a product list. The state lives in the URL
 * (?q=, ?category=, ?style=, ?stock=in, ?sort=) so results can be shared.
 */
export function ProductListing({ collection }: { collection?: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const search = searchParams.get("q")?.trim() ?? "";
  const category = collection ?? searchParams.get("category") ?? "";
  const tag = searchParams.get("style") ?? "";
  const inStockOnly = searchParams.get("stock") === "in";
  const sortParam = searchParams.get("sort");
  const sort = isProductSortKey(sortParam) ? sortParam : "featured";

  const query: ProductQuery = {
    collection: category || undefined,
    search: search || undefined,
    tag: tag || undefined,
    inStockOnly,
    sort,
  };

  const facets = useStoreQuery(`facets:${collection ?? "*"}`, async (store) => {
    const [products, collections] = await Promise.all([
      store.getProducts({ collection }),
      collection ? Promise.resolve([]) : store.getCollections(),
    ]);
    return { tags: filterableTags(products), collections };
  });
  const results = useStoreQuery(`products:${JSON.stringify(query)}`, (store) => store.getProducts(query));

  const tags = facets.status === "success" ? facets.data.tags : [];
  const collections = facets.status === "success" ? facets.data.collections : [];
  const hasFilters = Boolean(search || (!collection && category) || tag || inStockOnly);

  const setParam = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    const queryString = next.toString();
    window.history.replaceState(null, "", queryString ? `${pathname}?${queryString}` : pathname);
  };
  const clearFilters = () => window.history.replaceState(null, "", pathname);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-card p-4 sm:grid-cols-3 lg:grid-cols-4">
        {!collection && (
          <SelectField label="Category" value={category} onValueChange={(value) => setParam("category", value)}>
            <option value="">All categories</option>
            {collections.map((item) => (
              <option key={item.handle} value={item.handle}>
                {item.title}
              </option>
            ))}
          </SelectField>
        )}
        <SelectField label="Riding style" value={tag} onValueChange={(value) => setParam("style", value)}>
          <option value="">Any style</option>
          {tags.map((item) => (
            <option key={item} value={item}>
              {tagLabel(item)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Sort by"
          value={sort}
          onValueChange={(value) => setParam("sort", value === "featured" ? "" : value)}
        >
          {PRODUCT_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <label className="flex min-h-11 items-center gap-2.5 self-end text-sm font-semibold">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => setParam("stock", event.target.checked ? "in" : "")}
            className="size-5 accent-ink"
          />
          In stock only
        </label>
      </div>

      <div className="flex min-h-6 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <p role="status" className="text-ink-soft">
          {results.status === "success" &&
            `${results.data.length} ${results.data.length === 1 ? "part" : "parts"}${search ? ` matching “${search}”` : ""}`}
        </p>
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="font-semibold underline underline-offset-4">
            Clear filters
          </button>
        )}
      </div>

      {results.status === "loading" && <ProductGridSkeleton />}
      {results.status === "error" && <ErrorState message={results.error} onRetry={results.reload} />}
      {results.status === "success" &&
        (results.data.length > 0 ? (
          <ProductGrid products={results.data} />
        ) : (
          <EmptyState
            title="No parts match"
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          >
            Try another search word, or remove a filter.
          </EmptyState>
        ))}
    </div>
  );
}
