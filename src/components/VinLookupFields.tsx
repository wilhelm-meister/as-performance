"use client";

import { useState } from "react";
import { cleanVin, isValidVin } from "@/lib/vin";

type Initial = {
  vin?: string;
  model?: string;
  year?: string;
  fuel?: string;
  engine?: string;
};

type Msg = { kind: "ok" | "warn" | "error"; text: string } | null;

const field =
  "w-full h-10 border border-[#e5e5e7] rounded-lg px-3 text-[14px] outline-none focus:border-[#0071e3] bg-white";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

/**
 * VIN-Feld mit „Daten laden"-Knopf plus Modell/Baujahr/Kraftstoff/Motor.
 * Gefundene Daten werden eingetragen, bleiben aber von Hand änderbar.
 */
export function VinLookupFields({ initial }: { initial?: Initial }) {
  const [vin, setVin] = useState(initial?.vin ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [year, setYear] = useState(initial?.year ?? "");
  const [fuel, setFuel] = useState(initial?.fuel ?? "");
  const [engine, setEngine] = useState(initial?.engine ?? "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const lookup = async () => {
    const v = cleanVin(vin);
    setVin(v);
    setMsg(null);

    if (!isValidVin(v)) {
      setMsg({
        kind: "error",
        text: "Eine VIN hat genau 17 Zeichen (ohne I, O, Q) — bitte prüfen.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/vin/${v}`);
      const data = await res.json();
      if (!res.ok) {
        setMsg({ kind: "error", text: data?.error ?? "Abfrage fehlgeschlagen." });
        return;
      }

      const found: string[] = [];
      const modelText = [data.make, data.model].filter(Boolean).join(" ").trim();
      if (modelText) {
        setModel(modelText);
        found.push("Modell");
      }
      if (data.year) {
        setYear(String(data.year));
        found.push("Baujahr");
      }
      if (data.fuel) {
        setFuel(data.fuel);
        found.push("Kraftstoff");
      }
      if (data.engine) {
        setEngine(data.engine);
        found.push("Motor");
      }

      setMsg(
        found.length
          ? { kind: "ok", text: `✓ Übernommen: ${found.join(", ")} — bitte kurz prüfen.` }
          : {
              kind: "warn",
              text: "Zu dieser VIN liefert die Datenbank keine Details — bitte von Hand ausfüllen.",
            }
      );
    } catch {
      setMsg({ kind: "error", text: "Keine Verbindung zur Fahrzeugdatenbank." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Labeled label="VIN (Fahrgestellnummer)">
        <div className="flex gap-2">
          <input
            name="vin"
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            placeholder="WVWZZZ…"
            className={`${field} font-mono flex-1`}
          />
          <button
            type="button"
            onClick={lookup}
            disabled={loading}
            className="h-10 px-3.5 shrink-0 rounded-lg border border-[#e5e5e7] bg-white font-semibold text-[13px] cursor-pointer hover:border-[#0071e3] hover:text-[#0071e3] disabled:opacity-60 inline-flex items-center gap-1.5"
          >
            {loading ? "Lädt…" : "Daten laden"}
          </button>
        </div>
        {msg && (
          <div
            className={`mt-1.5 text-[12px] ${
              msg.kind === "ok"
                ? "text-[#1d8a4e]"
                : msg.kind === "warn"
                  ? "text-[#9a6a00]"
                  : "text-[#c9362b]"
            }`}
          >
            {msg.text}
          </div>
        )}
      </Labeled>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3.5">
        <Labeled label="Marke / Modell">
          <input
            name="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="BMW 320d"
            className={field}
          />
        </Labeled>
        <Labeled label="Baujahr">
          <input
            name="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2019"
            className={`${field} font-mono`}
          />
        </Labeled>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Labeled label="Kraftstoff">
          <input
            name="fuel"
            value={fuel}
            onChange={(e) => setFuel(e.target.value)}
            placeholder="Diesel"
            className={field}
          />
        </Labeled>
        <Labeled label="Motor">
          <input
            name="engine"
            value={engine}
            onChange={(e) => setEngine(e.target.value)}
            placeholder="2,0 l · 110 kW (150 PS)"
            className={field}
          />
        </Labeled>
      </div>
    </>
  );
}
