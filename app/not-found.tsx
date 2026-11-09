import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export default function NotFound() {
  return (
    <div className="page-width py-16">
      <h1 className="sr-only">Page not found</h1>
      <EmptyState title="Page not found" action={<ButtonLink href="/products">Browse all parts</ButtonLink>}>
        That page doesn&apos;t exist in this demo store.
      </EmptyState>
    </div>
  );
}
