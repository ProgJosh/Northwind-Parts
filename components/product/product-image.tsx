import Image from "next/image";
import type { Image as StoreImage } from "@/lib/commerce/types";

interface ProductImageProps {
  image: StoreImage | null;
  sizes: string;
  className?: string;
}

/** A product or collection image that fills its (square) container. */
export function ProductImage({ image, sizes, className = "" }: ProductImageProps) {
  if (!image) {
    return (
      <div className={`flex h-full w-full items-center justify-center text-xs text-ink-soft ${className}`}>
        No image
      </div>
    );
  }
  return (
    <Image
      src={image.url}
      alt={image.altText}
      width={image.width}
      height={image.height}
      sizes={sizes}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
