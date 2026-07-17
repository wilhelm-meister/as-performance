"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Customer, Vehicle } from "@/lib/types";
import type { HolderExtract } from "@/lib/gemini";
import { cleanVin, isValidVin } from "@/lib/vin";
import { createCustomerFromHolderAction, saveVehicleAction } from "@/app/(app)/fahrzeuge/actions";

export type VehiclePrefill = {
  plate?: string;
  model?: string;
  vin?: string;
  year?: string;
  first_registration?: string;
  fuel?: string;
  engine?: string;
  hsn?: string;
  tsn?: string;
  km?: string;
};

type LeanCustomer = Pick<Customer, "id" | "name" | "company">;

const field =
  "w-full h-10 border border-[#e5e5e7] rounded-lg px-3 text-[14px] outline-none focus:border-[#0071e3] bg-white";

const normName = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

// Halter grob einem bestehenden Kunden zuordnen (verhindert Dubletten)
function matchHolder(name: string, list: LeanCustomer[]): LeanCustomer | undefined {
  const n = normName(name);
  if (n.length < 3) return undefined;
  return list.find((c) => {
    const cn = normName(c.name);
    return cn.length >= 3 && (cn === n || cn.includes(n) || n.includes(cn));
  });
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function VehicleEditor({
  vehicle,
  customers: customersProp,
  presetCustomerId,
  prefill,
  holder,
  documentPath,
  documentPreview,
  existingDocUrl,
  onBack,
}: {
  vehicle?: Vehicle;
  customers: LeanCustomer[];
  presetCustomerId?: string;
  prefill?: VehiclePrefill;
  holder?: HolderExtract | null;
  documentPath?: string;
  documentPreview?: string;
  existingDocUrl?: string | null;
  onBack?: () => void;
}) {
  const router = useRouter();
  const isNew = !vehicle;
  const init = prefill ?? {};

  const [customers, setCustomers] = useState<LeanCustomer[]>(customersProp);
  // Halter aus dem Schein ggf. einem bestehenden Kunden zuordnen (verhindert Dubletten)
  const holderMatch = holder?.name ? matchHolder(holder.name, customersProp) : undefined;
  const [holderDone, setHolderDone] = useState(false);

  const [plate, setPlate] = useState(vehicle?.plate ?? init.plate ?? "");
  const [customerId, setCustomerId] = useState(
    vehicle?.customer_id ?? presetCustomerId ?? holderMatch?.id ?? ""
  );
  const [vin, setVin] = useState(vehicle?.vin ?? init.vin ?? "");
  const [model, setModel] = useState(vehicle?.model ?? init.model ?? "");
  const [firstReg, setFirstReg] = useState(
    vehicle?.first_registration ?? init.first_registration ?? ""
  );
  const [year, setYear] = useState(
    vehicle?.year != null ? String(vehicle.year) : init.year ?? ""
  );
  const [fuel, setFuel] = useState(vehicle?.fuel ?? init.fuel ?? "");
  const [engine, setEngine] = useState(vehicle?.engine ?? init.engine ?? "");
  const [hsn, setHsn] = useState(vehicle?.hsn ?? init.hsn ?? "");
  const [tsn, setTsn] = useState(vehicle?.tsn ?? init.tsn ?? "");
  const [km, setKm] = useState(
    vehicle?.km != null ? String(vehicle.km) : init.km ?? ""
  );

  const [lookupMsg, setLookupMsg] = useState<{ kind: "ok" | "warn" | "error"; text: string } | null>(
    null
  );
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const takeHolder = () => {
    if (!holder?.name) return;
    setError(null);
    start(async () => {
      const r = await createCustomerFromHolderAction({
        name: holder.name,
        street: holder.street,
        zip: holder.zip,
        city: holder.city,
      });
      if (r.id) {
        setCustomers((prev) => [...prev, { id: r.id!, name: r.name ?? holder.name, company: "" }]);
        setCustomerId(r.id);
        setHolderDone(true);
      } else {
        setError(r.error ?? "Kunde konnte nicht angelegt werden.");
      }
    });
  };

  const lookupVin = async () => {
    const v = cleanVin(vin);
    setVin(v);
    setLookupMsg(null);
    if (!isValidVin(v)) {
      setLookupMsg({ kind: "error", text: "Eine FIN hat genau 17 Zeichen (ohne I, O, Q)." });
      return;
    }
    setLooking(true);
    try {
      const res = await fetch(`/api/vin/${v}`);
      const data = await res.json();
      if (!res.ok) {
        setLookupMsg({ kind: "error", text: data?.error ?? "Abfrage fehlgeschlagen." });
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
      setLookupMsg(
        found.length
          ? { kind: "ok", text: `✓ Übernommen: ${found.join(", ")} — bitte prüfen.` }
          : { kind: "warn", text: "Keine Details gefunden — bitte von Hand ausfüllen." }
      );
    } catch {
      setLookupMsg({ kind: "error", text: "Keine Verbindung zur Fahrzeugdatenbank." });
    } finally {
      setLooking(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("plate", plate);
    fd.set("customer_id", customerId);
    fd.set("vin", vin);
    fd.set("model", model);
    fd.set("first_registration", firstReg);
    fd.set("year", year);
    fd.set("fuel", fuel);
    fd.set("engine", engine);
    fd.set("hsn", hsn);
    fd.set("tsn", tsn);
    fd.set("km", km);
    if (documentPath) fd.set("document_path", documentPath);

    start(async () => {
      const r = await saveVehicleAction(vehicle?.id ?? null, null, fd);
      if (r?.ok && r.id) {
        router.push(
          `/fahrzeuge/${r.id}?ok=${encodeURIComponent(isNew ? "Fahrzeug angelegt" : "Gespeichert")}`
        );
      } else {
        setError(r?.error ?? "Speichern fehlgeschlagen.");
      }
    });
  };

  const previewSrc = documentPreview || existingDocUrl || null;

  return (
    <form onSubmit={submit}>
      <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-[#ececf0] flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-[13px] text-[#0071e3] hover:text-[#0060c9] shrink-0"
            >
              ← zurück
            </button>
          )}
          <div>
            <div className="text-[16px] font-bold">
              {isNew ? "Fahrzeugdaten prüfen" : "Fahrzeug bearbeiten"}
            </div>
            <div className="text-[12.5px] text-[#86868b] mt-0.5">
              Alle Felder sind änderbar — kurz gegenlesen und speichern.
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {holder?.name && (
            <div className="sm:col-span-2">
              {holderMatch ? (
                <div className="rounded-lg bg-[#f0f7f2] border border-[#bfe3cd] px-4 py-3 text-[13px] text-[#1d6b3f]">
                  ✓ Halter <strong>{holder.name}</strong> ist bereits Kunde — automatisch zugeordnet.
                </div>
              ) : holderDone ? (
                <div className="rounded-lg bg-[#f0f7f2] border border-[#bfe3cd] px-4 py-3 text-[13px] text-[#1d6b3f]">
                  ✓ Kunde <strong>{holder.name}</strong> aus dem Fahrzeugschein angelegt und zugeordnet.
                </div>
              ) : (
                <div className="rounded-lg bg-[#f5f8ff] border border-[#b9d4f5] px-4 py-3.5">
                  <div className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-[0.5px] mb-1">
                    Halter laut Fahrzeugschein
                  </div>
                  <div className="text-[14px] font-semibold">{holder.name}</div>
                  {(holder.street || holder.city) && (
                    <div className="text-[13px] text-[#424245] mt-0.5">
                      {[holder.street, [holder.zip, holder.city].filter(Boolean).join(" ")]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 flex-wrap mt-2.5">
                    <button
                      type="button"
                      onClick={takeHolder}
                      disabled={pending}
                      className="h-9 px-3.5 rounded-lg bg-[#0071e3] text-white font-semibold text-[13px] cursor-pointer hover:bg-[#0060c9] disabled:opacity-60"
                    >
                      {pending ? "Legt an…" : "+ Als Kunden übernehmen"}
                    </button>
                    <span className="text-[12px] text-[#86868b]">
                      oder unten manuell einem Kunden zuordnen
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <Labeled label="Kennzeichen">
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="VER-AS 123"
              className={`${field} font-mono`}
            />
          </Labeled>
          <Labeled label="Kunde (optional)">
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className={`${field} cursor-pointer`}
            >
              <option value="">— kein Kunde —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.company ? ` · ${c.company}` : ""}
                </option>
              ))}
            </select>
          </Labeled>

          <div className="sm:col-span-2">
            <Labeled label="FIN (Fahrgestellnummer)">
              <div className="flex gap-2">
                <input
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="WVWZZZ…"
                  className={`${field} font-mono flex-1`}
                />
                <button
                  type="button"
                  onClick={lookupVin}
                  disabled={looking}
                  className="h-10 px-3.5 shrink-0 rounded-lg border border-[#e5e5e7] bg-white font-semibold text-[13px] cursor-pointer hover:border-[#0071e3] hover:text-[#0071e3] disabled:opacity-60"
                >
                  {looking ? "Lädt…" : "Daten laden"}
                </button>
              </div>
              {lookupMsg && (
                <div
                  className={`mt-1.5 text-[12px] ${
                    lookupMsg.kind === "ok"
                      ? "text-[#1d8a4e]"
                      : lookupMsg.kind === "warn"
                        ? "text-[#9a6a00]"
                        : "text-[#c9362b]"
                  }`}
                >
                  {lookupMsg.text}
                </div>
              )}
            </Labeled>
          </div>

          <div className="sm:col-span-2">
            <Labeled label="Marke / Modell">
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Volkswagen Golf"
                className={field}
              />
            </Labeled>
          </div>

          <Labeled label="Erstzulassung">
            <input
              type="date"
              value={firstReg}
              onChange={(e) => {
                setFirstReg(e.target.value);
                const y = e.target.value.slice(0, 4);
                if (/^\d{4}$/.test(y)) setYear(y);
              }}
              className={field}
            />
          </Labeled>
          <Labeled label="Baujahr">
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2019"
              className={`${field} font-mono`}
            />
          </Labeled>

          <Labeled label="Kraftstoff">
            <input
              value={fuel}
              onChange={(e) => setFuel(e.target.value)}
              placeholder="Diesel"
              className={field}
            />
          </Labeled>
          <Labeled label="Motor">
            <input
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              placeholder="2,0 l · 110 kW (150 PS)"
              className={field}
            />
          </Labeled>

          <Labeled label="Schlüsselnummer HSN (2.1)">
            <input
              value={hsn}
              onChange={(e) => setHsn(e.target.value)}
              placeholder="0603"
              className={`${field} font-mono`}
            />
          </Labeled>
          <Labeled label="Schlüsselnummer TSN (2.2)">
            <input
              value={tsn}
              onChange={(e) => setTsn(e.target.value)}
              placeholder="BGV"
              className={`${field} font-mono`}
            />
          </Labeled>

          <Labeled label="KM-Stand">
            <input
              value={km}
              onChange={(e) => setKm(e.target.value)}
              placeholder="85000"
              className={`${field} font-mono`}
            />
          </Labeled>

          {previewSrc && (
            <div className="sm:col-span-2">
              <div className="text-[12px] font-semibold text-[#6e6e73] mb-1.5">
                Fahrzeugschein-Foto
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt="Fahrzeugschein"
                className="rounded-lg border border-[#e5e5e7] max-h-[220px] w-auto object-contain"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="mx-4 md:mx-6 mb-4 rounded-[9px] bg-[#fff2f1] border border-[#f3c4c0] px-4 py-3 text-[13px] text-[#c9362b]">
            {error}
          </div>
        )}

        <div className="px-4 md:px-6 py-4 border-t border-[#ececf0] bg-[#fafafc] flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => router.push(vehicle ? `/fahrzeuge/${vehicle.id}` : "/fahrzeuge")}
            className="h-10 px-[18px] border border-[#e5e5e7] rounded-lg bg-white font-semibold text-[14px] cursor-pointer hover:border-[#0071e3] hover:text-[#0071e3]"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={pending}
            className="h-10 px-[22px] rounded-lg bg-[#0071e3] text-white font-semibold text-[14px] cursor-pointer hover:bg-[#0060c9] disabled:opacity-60"
          >
            {pending ? "Speichert…" : "Fahrzeug speichern"}
          </button>
        </div>
      </div>
    </form>
  );
}
