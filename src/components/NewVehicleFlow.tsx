"use client";

import { useRef, useState, useTransition } from "react";
import type { Customer } from "@/lib/types";
import { VehicleEditor, type VehiclePrefill } from "./VehicleEditor";
import { scanFahrzeugscheinAction } from "@/app/(app)/fahrzeuge/actions";

// Foto vor dem Hochladen verkleinern (spart Zeit/Datenvolumen, wandelt auch HEIC → JPG,
// solange der Browser es zeichnen kann). Klappt das nicht, wird das Original genutzt.
async function downscale(file: File): Promise<Blob> {
  try {
    const url = URL.createObjectURL(file);
    const img = document.createElement("img");
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("decode"));
      img.src = url;
    });
    const max = 1600;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
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
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", 0.85)
    );
    if (!blob) throw new Error("blob");
    return blob;
  } catch {
    return file;
  }
}

type Mode = "choose" | "scanning" | "form" | "fin";

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
  const [documentPath, setDocumentPath] = useState<string | undefined>();
  const [preview, setPreview] = useState<string | undefined>();
  const [scanError, setScanError] = useState<string | null>(null);
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
      setDocumentPath(r.documentPath);
      setPreview(previewUrl);
      setMode("form");
    });
  };

  if (mode === "form" || mode === "fin") {
    return (
      <VehicleEditor
        customers={customers}
        presetCustomerId={presetCustomerId}
        prefill={mode === "form" ? prefill : undefined}
        documentPath={mode === "form" ? documentPath : undefined}
        documentPreview={mode === "form" ? preview : undefined}
        onBack={() => setMode("choose")}
      />
    );
  }

  if (mode === "scanning") {
    return (
      <div className="bg-white border border-[#e5e5e7] rounded-2xl px-6 py-14 flex flex-col items-center text-center">
        <div className="w-9 h-9 border-[3px] border-[#e5e5e7] border-t-[#0071e3] rounded-full animate-spin mb-4" />
        <div className="text-[15px] font-semibold">Der Fahrzeugschein wird gelesen…</div>
        <div className="text-[13px] text-[#86868b] mt-1">
          Die KI erkennt Kennzeichen, Marke, FIN und mehr. Einen Moment.
        </div>
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
          onClick={() => setMode("fin")}
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
