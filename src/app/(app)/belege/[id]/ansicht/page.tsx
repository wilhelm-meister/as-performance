import Link from "next/link";
import { notFound } from "next/navigation";
import { getDoc } from "@/lib/data";
import { PdfShareButton } from "@/components/PdfShareButton";

const BTN =
  "h-9 px-3 rounded-lg font-semibold text-[13px] inline-flex items-center gap-1.5 border border-[#e5e5e7] bg-white hover:border-[#0071e3] hover:text-[#0071e3] whitespace-nowrap shrink-0";

/**
 * In-App-PDF-Ansicht. Zeigt das PDF im eigenen Rahmen (iframe) MIT festem
 * „← Zurück". Dadurch bleibt der Nutzer in der App und kommt immer zurück —
 * egal ob installierte App, In-App-Browser oder Safari (keine Sackgasse mehr).
 */
export default async function BelegAnsichtPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ typ?: string }>;
}) {
  const { id } = await params;
  const { typ } = await searchParams;

  const doc = await getDoc(id);
  if (!doc) notFound();

  const isMahnung = typ === "mahnung";
  const pdfUrl = isMahnung ? `/api/belege/${id}/mahnung` : `/api/belege/${id}/pdf`;
  const noun = doc.type === "quote" ? "Angebot" : "Rechnung";
  const label = isMahnung ? `Mahnung ${doc.number}` : `${noun} ${doc.number}`;
  const fileName = isMahnung ? `Mahnung-${doc.number}.pdf` : `${doc.number}.pdf`;

  return (
    <>
      <header className="h-[56px] shrink-0 bg-white border-b border-[#e5e5e7] flex items-center gap-2 px-3 md:px-5">
        <Link
          href={`/belege/${id}`}
          className="inline-flex items-center gap-1 h-9 pl-1.5 pr-3 rounded-lg text-[13.5px] font-semibold text-[#0071e3] hover:bg-[#f2f2f2] shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Zurück
        </Link>

        <div className="hidden sm:block flex-1 min-w-0 text-[14px] font-semibold truncate">
          {label}
        </div>
        <span className="flex-1 sm:hidden" />

        <PdfShareButton pdfUrl={pdfUrl} fileName={fileName} title={label} className={BTN} />
        <a href={`${pdfUrl}?download=1`} download={fileName} className={BTN}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Speichern
        </a>
      </header>

      <iframe src={pdfUrl} title={label} className="flex-1 w-full border-0 bg-[#4b4f52]" />
    </>
  );
}
