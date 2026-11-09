import type { Metadata } from "next";
import { AdminView } from "@/components/admin/admin-view";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Demo admin" };

export default function AdminPage() {
  return (
    <div className="page-width py-8 sm:py-10">
      <PageHeader eyebrow="Demo admin · read-only" title="Orders and stock">
        Everything here comes from the demo store saved in this browser: orders placed with test cards, and live stock
        for every option. A real admin would sit behind a login.
      </PageHeader>
      <AdminView />
    </div>
  );
}
