"use client";

import { useEffect, useState } from "react";

/**
 * „Teilen"-Knopf für die In-App-PDF-Ansicht. Öffnet das native Teilen-Menü
 * (WhatsApp, Mail, AirDrop, In Dateien sichern) mit der PDF-Datei.
 *
 * Rendert sich NUR, wenn das Gerät Datei-Teilen unterstützt — sonst gar nicht,
 * damit kein toter Knopf entsteht (Speichern übernimmt dann der Download-Link).
 * Die Datei wird vorab geladen, weil iOS `navigator.share` nur direkt im
 * Tippmoment erlaubt (kein `await fetch` dazwischen).
 */
export function PdfShareButton({
  pdfUrl,
  fileName,
  title,
  className,
}: {
  pdfUrl: string;
  fileName: string;
  title: string;
  className: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(pdfUrl)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("PDF fehlgeschlagen"))))
      .then((b) => {
        if (!alive) return;
        const f = new File([b], fileName, { type: "application/pdf" });
        setFile(f);
        if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [f] })) {
          setSupported(true);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pdfUrl, fileName]);

  if (!supported) return null;

  async function share() {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title });
    } catch {
      /* Nutzer hat abgebrochen – nichts tun. */
    }
  }

  return (
    <button type="button" onClick={share} className={className}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v13" />
        <path d="m8 7 4-4 4 4" />
        <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
      </svg>
      Teilen
    </button>
  );
}
