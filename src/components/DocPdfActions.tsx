"use client";

import { useEffect, useState } from "react";

/**
 * PDF-Aktionen für einen Beleg.
 *
 * Problem vorher: „PDF ansehen" öffnete die rohe PDF-Route und ersetzte auf
 * dem Handy / in der installierten App die ganze Oberfläche → Sackgasse ohne
 * Zurück, und speichern ging nicht.
 *
 * Jetzt:
 *  - Handy: EIN Knopf „Speichern / Teilen" öffnet das native iOS-/Android-
 *    Teilen-Menü (In Dateien sichern, Drucken, WhatsApp, Mail, Vorschau).
 *    Das lässt sich immer schließen → keine Sackgasse, und Speichern ist dabei.
 *  - Desktop: „Ansehen" (neuer Tab) + „Speichern" (Download).
 *
 * Die PDF-Datei wird auf dem Handy vorab geladen, weil iOS `navigator.share`
 * nur direkt im Tippmoment erlaubt (kein `await fetch` dazwischen).
 */

const BTN =
  "h-9 px-3.5 rounded-lg font-semibold text-[13px] inline-flex items-center gap-1.5 border border-[#e5e5e7] bg-white hover:border-[#0071e3] hover:text-[#0071e3] whitespace-nowrap";

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v13" />
      <path d="m8 7 4-4 4 4" />
      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
    </svg>
  );
}

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
  url,
  fileName,
  title,
}: {
  url: string;
  fileName: string;
  title: string;
}) {
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    // Nur auf schmalen Geräten vorladen (dort wird geteilt); Desktop nutzt die Links.
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 767px)").matches) {
      return;
    }
    let alive = true;
    fetch(url)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("PDF fehlgeschlagen"))))
      .then((b) => {
        if (alive) setFile(new File([b], fileName, { type: "application/pdf" }));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [url, fileName]);

  function downloadBlob() {
    const a = document.createElement("a");
    a.href = file ? URL.createObjectURL(file) : `${url}?download=1`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function onShare() {
    if (file && typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title });
      } catch {
        /* Nutzer hat das Teilen-Menü abgebrochen – nichts weiter tun. */
      }
    } else {
      // Kein Datei-Teilen möglich (z. B. älteres Android) → speichern.
      downloadBlob();
    }
  }

  return (
    <>
      {/* Handy: öffnet das native Teilen-/Sichern-Menü */}
      <button type="button" onClick={onShare} className={`${BTN} md:hidden`}>
        <ShareIcon />
        Speichern / Teilen
      </button>

      {/* Desktop: Ansehen (neuer Tab) + Speichern (Download) */}
      <a href={url} target="_blank" rel="noopener" className={`${BTN} hidden md:inline-flex`}>
        <EyeIcon />
        Ansehen
      </a>
      <a href={`${url}?download=1`} download={fileName} className={`${BTN} hidden md:inline-flex`}>
        <DownloadIcon />
        Speichern
      </a>
    </>
  );
}
