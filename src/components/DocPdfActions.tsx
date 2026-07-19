import Link from "next/link";

/**
 * PDF-Aktionen in der Beleg-Knopfleiste.
 *
 * Wichtig gegen die „Sackgasse": Auf dem Handy führt „PDF ansehen" NICHT mehr
 * auf die rohe PDF-Route (die die App ersetzt und kein Zurück hat), sondern per
 * In-App-Navigation auf die eigene Ansichtsseite `/belege/[id]/ansicht` mit
 * festem „← Zurück". Auf dem Desktop bleibt es beim neuen Tab + Download.
 */
const BTN =
  "h-9 px-3.5 rounded-lg font-semibold text-[13px] inline-flex items-center gap-1.5 border border-[#e5e5e7] bg-white hover:border-[#0071e3] hover:text-[#0071e3] whitespace-nowrap";

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function DocPdfActions({
  pdfUrl,
  viewerUrl,
  fileName,
}: {
  pdfUrl: string;
  viewerUrl: string;
  fileName: string;
}) {
  return (
    <>
      {/* Handy: In-App-Ansicht mit garantiertem „Zurück" (keine Sackgasse) */}
      <Link href={viewerUrl} className={`${BTN} md:hidden`}>
        <EyeIcon />
        PDF ansehen
      </Link>

      {/* Desktop: neuer Tab + Download */}
      <a href={pdfUrl} target="_blank" rel="noopener" className={`${BTN} hidden md:inline-flex`}>
        <EyeIcon />
        Ansehen
      </a>
      <a href={`${pdfUrl}?download=1`} download={fileName} className={`${BTN} hidden md:inline-flex`}>
        <DownloadIcon />
        Speichern
      </a>
    </>
  );
}
