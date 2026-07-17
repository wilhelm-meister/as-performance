"use client";

import { useRef, useState, useTransition } from "react";
import type { Customer } from "@/lib/types";
import type { HolderExtract } from "@/lib/gemini";
import { VehicleEditor, type VehiclePrefill } from "./VehicleEditor";
import { cleanVin, isValidVin } from "@/lib/vin";
import { scanFahrzeugscheinAction } from "@/app/(app)/fahrzeuge/actions";

// Foto vor dem Hochladen verkleinern (spart Zeit/Datenvolumen, wandelt auch HEIC → JPG,
// solange der Browser es zeichnen kann). Klappt das nicht, wird das Original genutzt.
async function downscale(file: File): Promise<Blob> {
  try {
    // createImageBitmap mit "from-image" dreht das Foto anhand der Kamera-Ausrichtung (EXIF)
    // gerade — sonst landen Hochformat-Aufnahmen oft seitwärts auf dem Beleg.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const max = 1600;
    let w = bitmap.width;
    let h = bitmap.height;
    if (Math.max(w, h) > max) {
      const s = max / Math.max(w, h);
      w = Math.round(w * s);
      h = Math.round(h * s);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("ctx");
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", 0.85)
    );
    if (!blob) throw new Error("blob");
    return blob;
  } catch {
    return file;
  }
}

type Mode = "choose" | "scanning" | "form" | "fin" | "fin-input" | "fin-loading";

function ChoiceCard({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: string;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white border border-[#e5e5e7] rounded-2xl px-6 py-7 text-left cursor-pointer hover:border-[#0071e3] hover:shadow-[0_8px_30px_rgba(0,113,227,0.08)] transition"
    >
      <div className="text-[34px] leading-none mb-3">{icon}</div>
      <div className="text-[16px] font-bold mb-1">{title}</div>
      <div className="text-[13px] text-[#6e6e73] leading-relaxed">{desc}</div>
    </button>
  );
}

export function NewVehicleFlow({
  customers,
  presetCustomerId,
}: {
  customers: Pick<Customer, "id" | "name" | "company">[];
  presetCustomerId?: string;
}) {
  const [mode, setMode] = useState<Mode>("choose");
  const [prefill, setPrefill] = useState<VehiclePrefill | undefined>();
  const [holder, setHolder] = useState<HolderExtract | null>(null);
  const [documentPath, setDocumentPath] = useState<string | undefined>();
  const [preview, setPreview] = useState<string | undefined>();
  const [scanError, setScanError] = useState<string | null>(null);
  const [finInput, setFinInput] = useState("");
  const [finError, setFinError] = useState<string | null>(null);
  const [, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setScanError(null);
    setMode("scanning");

    const blob = await downscale(file);
    const previewUrl = URL.createObjectURL(blob);
    const fd = new FormData();
    fd.set("photo", blob, "schein.jpg");

    start(async () => {
      const r = await scanFahrzeugscheinAction(fd);
      if (r.error || !r.data) {
        setScanError(r.error ?? "Der Fahrzeugschein konnte nicht gelesen werden.");
        setMode("choose");
        return;
      }
      setPrefill(r.data);
      setHolder(r.data.holder);
      setDocumentPath(r.documentPath);
      setPreview(previewUrl);
      setMode("form");
    });
  };

  // FIN-Route: erst nur die FIN, dekodieren, dann volles Formular öffnen (vorausgefüllt)
  const onFinSubmit = () => {
    const v = cleanVin(finInput);
    if (!isValidVin(v)) {
      setFinError("Eine FIN hat genau 17 Zeichen (ohne die Buchstaben I, O, Q).");
      return;
    }
    setFinError(null);
    setMode("fin-loading");
    start(async () => {
      let pf: VehiclePrefill = { vin: v };
      try {
        const res = await fetch(`/api/vin/${v}`);
        const data = await res.json();
        if (res.ok) {
          const modelText = [data.make, data.model].filter(Boolean).join(" ").trim();
          pf = {
            vin: v,
            model: modelText || undefined,
            year: data.year ? String(data.year) : undefined,
            fuel: data.fuel || undefined,
            engine: data.engine || undefined,
          };
        }
      } catch {
        // Keine Verbindung zur Fahrzeugdatenbank — Formular trotzdem mit der FIN öffnen
      }
      setPrefill(pf);
      setHolder(null);
      setMode("form");
    });
  };

  if (mode === "form" || mode === "fin") {
    return (
      <VehicleEditor
        customers={customers}
        presetCustomerId={presetCustomerId}
        prefill={mode === "form" ? prefill : undefined}
        holder={mode === "form" ? holder : undefined}
        documentPath={mode === "form" ? documentPath : undefined}
        documentPreview={mode === "form" ? preview : undefined}
        onBack={() => setMode("choose")}
      />
    );
  }

  if (mode === "scanning" || mode === "fin-loading") {
    return (
      <div className="bg-white border border-[#e5e5e7] rounded-2xl px-6 py-14 flex flex-col items-center text-center">
        <div className="w-9 h-9 border-[3px] border-[#e5e5e7] border-t-[#0071e3] rounded-full animate-spin mb-4" />
        <div className="text-[15px] font-semibold">
          {mode === "scanning" ? "Der Fahrzeugschein wird gelesen…" : "Die FIN wird abgefragt…"}
        </div>
        <div className="text-[13px] text-[#86868b] mt-1">
          {mode === "scanning"
            ? "Die KI erkennt Kennzeichen, Marke, FIN und mehr. Einen Moment."
            : "Modell, Baujahr, Kraftstoff und Motor werden geladen. Einen Moment."}
        </div>
      </div>
    );
  }

  if (mode === "fin-input") {
    return (
      <div className="bg-white border border-[#e5e5e7] rounded-2xl px-5 md:px-8 py-8 md:py-10 max-w-[560px] mx-auto anim-popin">
        <button
          type="button"
          onClick={() => setMode("choose")}
          className="text-[13px] text-[#0071e3] hover:text-[#0060c9] mb-5"
        >
          ← zurück
        </button>
        <h2 className="text-[19px] font-bold tracking-[-0.2px]">Fahrgestellnummer eingeben</h2>
        <p className="text-[13.5px] text-[#6e6e73] mt-1.5 mb-5 leading-relaxed">
          Die FIN steht im Fahrzeugschein unter <strong>Feld E</strong> — genau 17 Zeichen.
          Danach werden Modell, Baujahr, Kraftstoff und Motor automatisch geladen.
        </p>
        <input
          value={finInput}
          onChange={(e) => {
            setFinInput(e.target.value.toUpperCase());
            if (finError) setFinError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onFinSubmit();
            }
          }}
          placeholder="z.B. WVWZZZ1KZAW123456"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          className="w-full h-12 border border-[#e5e5e7] rounded-lg px-3.5 text-[16px] font-mono tracking-[0.5px] outline-none focus:border-[#0071e3] bg-white"
        />
        {finError && (
          <div className="mt-2.5 rounded-[9px] bg-[#fff2f1] border border-[#f3c4c0] px-3.5 py-2.5 text-[13px] text-[#c9362b]">
            {finError}
          </div>
        )}
        <button
          type="button"
          onClick={onFinSubmit}
          className="mt-4 w-full h-11 rounded-lg bg-[#0071e3] text-white font-semibold text-[14px] cursor-pointer hover:bg-[#0060c9]"
        >
          Weiter →
        </button>
        <button
          type="button"
          onClick={() => setMode("fin")}
          className="mt-3 w-full text-[13px] text-[#6e6e73] hover:text-[#0071e3]"
        >
          FIN unbekannt? Alles von Hand eingeben
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPhoto}
        className="hidden"
      />

      {scanError && (
        <div className="mb-4 rounded-[9px] bg-[#fff2f1] border border-[#f3c4c0] px-4 py-3 text-[13px] text-[#c9362b]">
          {scanError}
        </div>
      )}

      <div className="text-[13px] text-[#6e6e73] mb-3.5">
        Wie möchtest du das Fahrzeug anlegen?
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <ChoiceCard
          icon="📸"
          title="Fahrzeugschein fotografieren"
          desc="Foto machen — die KI liest Kennzeichen, Marke, FIN, Erstzulassung, Schlüsselnummer und mehr automatisch aus."
          onClick={() => fileRef.current?.click()}
        />
        <ChoiceCard
          icon="⌨️"
          title="Fahrgestellnummer (FIN)"
          desc="FIN eintippen — Modell, Baujahr, Kraftstoff und Motor werden über die Fahrzeugdatenbank geladen."
          onClick={() => {
            setFinInput("");
            setFinError(null);
            setMode("fin-input");
          }}
        />
      </div>

      <button
        type="button"
        onClick={() => setMode("fin")}
        className="mt-4 text-[13px] text-[#0071e3] hover:text-[#0060c9]"
      >
        Oder: alles von Hand eingeben
      </button>
    </div>
  );
}
