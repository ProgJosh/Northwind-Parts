import credits from "@/data/photo-credits.json";

export interface PhotoCredit {
  file: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  source: string;
  changes: string;
}

export const PHOTO_CREDITS: Record<string, PhotoCredit> = credits;

/** "Stock photo by X, CC BY-SA 4.0" under a demo product photo. Renders nothing for other images. */
export function PhotoCreditLine({ url }: { url: string | undefined }) {
  const credit = url ? PHOTO_CREDITS[url] : undefined;
  if (!credit) return null;
  return (
    <p className="text-xs text-ink-soft">
      Illustrative stock photo, not the exact item.{" "}
      <a href={credit.source} className="underline underline-offset-2 hover:text-ink" rel="noreferrer" target="_blank">
        Photo: {credit.author}
      </a>
      ,{" "}
      {credit.licenseUrl ? (
        <a href={credit.licenseUrl} className="underline underline-offset-2 hover:text-ink" rel="noreferrer" target="_blank">
          {credit.license}
        </a>
      ) : (
        credit.license
      )}
      . {credit.changes}
    </p>
  );
}
