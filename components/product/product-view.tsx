"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { ChevronRightIcon } from "@/components/ui/icons";
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from "@/components/ui/states";
import { filterableTags, tagLabel } from "@/lib/commerce/product-query";
import { useStoreQuery } from "@/lib/commerce/react/use-store-query";
import type { Collection, Image as StoreImage, Product } from "@/lib/commerce/types";
import { findVariant, hasOnlyDefaultVariant, selectionOf } from "@/lib/commerce/variants";
import { AddToCart } from "./add-to-cart";
import { Price } from "./price";
import { ProductImage } from "./product-image";
import { VariantPicker } from "./variant-picker";

/** Short `?variant=` value (the id's last segment), as Shopify themes use. */
function variantParam(id: string): string {
  return id.slice(id.lastIndexOf("/") + 1);
}

function initialSelection(product: Product, param: string | null): Record<string, string> {
  const fromUrl = param ? product.variants.find((variant) => variantParam(variant.id) === param) : undefined;
  const firstAvailable = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  return selectionOf(fromUrl ?? firstAvailable);
}

export function ProductView({ handle }: { handle: string }) {
  const query = useStoreQuery(`product:${handle}`, async (store) => {
    const [product, collections] = await Promise.all([store.getProduct(handle), store.getCollections()]);
    const collection = product
      ? (collections.find((candidate) => product.collectionHandles.includes(candidate.handle)) ?? null)
      : null;
    return { product, collection };
  });

  if (query.status === "loading") return <ProductSkeleton />;
  if (query.status === "error") return <ErrorState message={query.error} onRetry={query.reload} />;

  const { product, collection } = query.data;
  if (!product) {
    return (
      <EmptyState
        title="We couldn't find that part"
        action={<ButtonLink href="/products">Browse all parts</ButtonLink>}
      >
        It may have been removed from the catalog.
      </EmptyState>
    );
  }
  return <ProductDetails key={product.id} product={product} collection={collection} />;
}

function ProductDetails({ product, collection }: { product: Product; collection: Collection | null }) {
  const searchParams = useSearchParams();
  const [selection, setSelection] = useState(() => initialSelection(product, searchParams.get("variant")));
  const [pickedImage, setPickedImage] = useState<StoreImage | null>(null);
  const variant = findVariant(product, selection) ?? null;
  const image = pickedImage ?? variant?.image ?? product.featuredImage;
  const ridingStyles = filterableTags([product]).map(tagLabel);

  const select = (optionName: string, value: string) => {
    const next = { ...selection, [optionName]: value };
    setSelection(next);
    setPickedImage(null);
    const match = findVariant(product, next);
    if (match) window.history.replaceState(null, "", `?variant=${variantParam(match.id)}`);
  };

  return (
    <>
      <Breadcrumbs collection={collection} title={product.title} />
      <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:gap-14">
        <Gallery product={product} image={image} onPick={setPickedImage} />

        <div className="flex min-w-0 flex-col gap-6">
          <header className="space-y-3">
            <p className="eyebrow">{product.productType}</p>
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">{product.title}</h1>
            {variant && (
              <Price price={variant.price} compareAtPrice={variant.compareAtPrice} className="text-2xl font-semibold" />
            )}
            <p className="text-xs text-ink-soft">Price includes VAT. Delivery costs are shown in your cart.</p>
          </header>

          {!hasOnlyDefaultVariant(product) && (
            <VariantPicker product={product} selection={selection} onSelect={select} />
          )}

          <AddToCart product={product} variant={variant} />

          <section aria-labelledby="product-details-heading" className="space-y-3">
            <h2 id="product-details-heading" className="font-display text-lg">
              Details
            </h2>
            <p className="leading-relaxed text-ink-soft">{product.description}</p>
            <dl className="divide-y divide-line rounded-lg border border-line bg-card text-sm">
              <SpecRow label="SKU">
                <span className="font-mono">{variant?.sku || "n/a"}</span>
              </SpecRow>
              <SpecRow label="Category">{collection?.title ?? product.productType}</SpecRow>
              {ridingStyles.length > 0 && <SpecRow label="Riding style">{ridingStyles.join(", ")}</SpecRow>}
              <SpecRow label="Brand">{product.vendor}</SpecRow>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}

function SpecRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-2.5">
      <dt className="eyebrow self-center">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function Breadcrumbs({ collection, title }: { collection: Collection | null; title: string }) {
  const separator = <ChevronRightIcon width={14} height={14} className="shrink-0" />;
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-ink-soft">
        <li>
          <Link href="/products" className="hover:text-ink hover:underline">
            All parts
          </Link>
        </li>
        {collection && (
          <li className="flex items-center gap-1.5">
            {separator}
            <Link href={`/collections/${collection.handle}`} className="hover:text-ink hover:underline">
              {collection.title}
            </Link>
          </li>
        )}
        <li className="flex items-center gap-1.5">
          {separator}
          <span aria-current="page" className="text-ink">
            {title}
          </span>
        </li>
      </ol>
    </nav>
  );
}

function Gallery({
  product,
  image,
  onPick,
}: {
  product: Product;
  image: StoreImage | null;
  onPick: (image: StoreImage) => void;
}) {
  return (
    <div className="space-y-3 md:sticky md:top-6 md:self-start">
      <div className="aspect-square overflow-hidden rounded-lg bg-well">
        <ProductImage image={image} sizes="(min-width: 768px) 50vw, 100vw" className="p-6 sm:p-10" />
      </div>
      {product.images.length > 1 && (
        <ul role="list" className="flex gap-2">
          {product.images.map((candidate, index) => (
            <li key={candidate.url}>
              <button
                type="button"
                onClick={() => onPick(candidate)}
                aria-label={`Show image ${index + 1} of ${product.images.length}`}
                aria-pressed={candidate.url === image?.url}
                className="size-16 overflow-hidden rounded-md border-2 border-transparent bg-well aria-pressed:border-ink"
              >
                <ProductImage image={{ ...candidate, altText: "" }} sizes="64px" className="p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <LoadingRegion label="Loading product">
      <div aria-hidden="true">
        <Skeleton className="mb-6 h-4 w-48" />
        <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:gap-14">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-36 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}
