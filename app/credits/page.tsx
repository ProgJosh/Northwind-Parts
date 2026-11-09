import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/layout/page-header";
import { PHOTO_CREDITS } from "@/components/product/photo-credit";

export const metadata: Metadata = { title: "Photo credits" };

export default function CreditsPage() {
  const entries = Object.entries(PHOTO_CREDITS);
  return (
    <div className="page-width py-10">
      <PageHeader eyebrow="Demo store" title="Photo credits">
        The product photos are openly licensed images from Wikimedia Commons. They show similar parts made by other
        companies and are used for illustration only: Northwind Parts is fictional and sells nothing.
      </PageHeader>
      <ul role="list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([url, credit]) => (
          <li key={url} className="flex gap-3 rounded-lg border border-line bg-card p-3">
            <Image src={url} alt="" width={80} height={80} className="size-20 shrink-0 rounded-md object-cover" />
            <div className="min-w-0 space-y-1 text-sm">
              <p className="truncate font-semibold" title={credit.file}>
                <a href={credit.source} className="underline-offset-2 hover:underline" rel="noreferrer" target="_blank">
                  {credit.file}
                </a>
              </p>
              <p className="text-ink-soft">By {credit.author}</p>
              <p className="text-ink-soft">
                {credit.licenseUrl ? (
                  <a href={credit.licenseUrl} className="underline underline-offset-2" rel="noreferrer" target="_blank">
                    {credit.license}
                  </a>
                ) : (
                  credit.license
                )}
                . {credit.changes}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
