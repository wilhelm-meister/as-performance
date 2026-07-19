"use client";

import { useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CustomerWithVehicles, DocWithRefs, Item, ItemType, Product } from "@/lib/types";
import { computeTotals, lineTotal } from "@/lib/totals";
import {
  ITEM_TYPE_LABEL,
  ITEM_UNIT,
  REMINDER_TITLE,
  docNoun,
  effectiveStatus,
  euro,
  formatDate,
  formatDateTime,
  todayISO,
  vehicleDetails,
} from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { ConfirmButton } from "./ConfirmButton";
import { CatalogPicker } from "./CatalogPicker";
import {
  cancelInvoiceAction,
  convertQuoteAction,
  createReminderAction,
  deleteDocumentAction,
  duplicateInvoiceAction,
  markPaidAction,
  saveDocumentAction,
  sendDocumentAction,
  sendReminderAction,
} from "@/app/(app)/belege/actions";

// Sauberes Umschlag-Icon (SVG) statt des Unicode-Zeichens ✉, das auf vielen
// Systemen als leeres Kästchen / fremdes Symbol dargestellt wird.
function MailIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

const ITEM_PLACEHOLDER: Record<ItemType, string> = {
  labor: "z.B. Bremsen erneuern",
  part: "z.B. Bremsscheiben",
  flat: "z.B. Klimaservice",
};

// Textfeld, das mit dem Inhalt in der Höhe mitwächst — lange Beschreibungen
// bleiben komplett sichtbar statt einzeilig abgeschnitten zu werden.
function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}

function ReminderSendButton({ docId, email }: { docId: string; email: string }) {
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!email) return null;

  if (!armed) {
    return (
      <span>
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="h-9 px-3.5 rounded-lg font-semibold text-[13px] cursor-pointer inline-flex items-center gap-1.5 border border-[#e5e5e7] bg-white hover:border-[#0071e3] hover:text-[#0071e3]"
        >
          <MailIcon />
          Mahnung senden
        </button>
        {error && <div className="mt-2 text-[12px] text-[#c9362b] max-w-[420px]">{error}</div>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 bg-[#f5f8ff] border border-[#b9d4f5] rounded-lg px-3 min-h-9 anim-popin">
      <span className="text-[12.5px] font-medium text-[#424245]">
        An <strong>{email}</strong> senden?
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const r = await sendReminderAction(docId);
            if (r.error) setError(r.error);
            setArmed(false);
            router.refresh();
          })
        }
        className="text-[12.5px] font-semibold text-[#0071e3] cursor-pointer hover:underline disabled:opacity-50"
      >
        {pending ? "Sendet…" : "Ja, senden"}
      </button>
      <span className="text-[#d2d2d7]">·</span>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="text-[12.5px] font-semibold text-[#6e6e73] cursor-pointer hover:underline"
      >
        Abbrechen
      </button>
    </span>
  );
}

function SendButton({ docId, email }: { docId: string; email: string }) {
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!email) {
    return (
      <span
        className="h-9 px-3.5 rounded-lg font-semibold text-[13px] inline-flex items-center gap-1.5 border border-[#e5e5e7] bg-[#f5f5f7] text-[#86868b]"
        title="Der Kunde hat keine E-Mail-Adresse hinterlegt"
      >
        <MailIcon />
        Senden
      </span>
    );
  }

  if (!armed) {
    return (
      <span>
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="h-9 px-3.5 rounded-lg font-semibold text-[13px] cursor-pointer inline-flex items-center gap-1.5 bg-[#0071e3] text-white hover:bg-[#0060c9]"
        >
          <MailIcon />
          Per E-Mail senden
        </button>
        {error && (
          <div className="mt-2 text-[12px] text-[#c9362b] max-w-[420px]">{error}</div>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 bg-[#f5f8ff] border border-[#b9d4f5] rounded-lg px-3 min-h-9 anim-popin">
      <span className="text-[12.5px] font-medium text-[#424245]">
        An <strong>{email}</strong> senden?
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const r = await sendDocumentAction(docId);
            if (r.error) {
              setError(r.error);
              setArmed(false);
            } else {
              setArmed(false);
              router.refresh();
            }
          })
        }
        className="text-[12.5px] font-semibold text-[#0071e3] cursor-pointer hover:underline disabled:opacity-50"
      >
        {pending ? "Sendet…" : "Ja, senden"}
      </button>
      <span className="text-[#d2d2d7]">·</span>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="text-[12.5px] font-semibold text-[#6e6e73] cursor-pointer hover:underline"
      >
        Abbrechen
      </button>
    </span>
  );
}

export function DocEditor({
  doc,
  docType,
  customers,
  products,
  hourlyRate,
  defaultVatRate,
  convertedNumber,
  sourceNumber,
  presetCustomerId,
}: {
  doc: DocWithRefs | null;
  docType: "quote" | "invoice";
  customers: CustomerWithVehicles[];
  products: Product[];
  hourlyRate: number;
  defaultVatRate: number;
  convertedNumber?: string | null;
  sourceNumber?: string | null;
  presetCustomerId?: string;
}) {
  const router = useRouter();
  const type = doc?.type ?? docType;
  const noun = docNoun(type);
  const listPath = type === "quote" ? "/angebote" : "/rechnungen";

  const initialCustomer = doc?.customer_id ?? presetCustomerId ?? "";
  const presetVehicle =
    !doc && presetCustomerId
      ? customers.find((c) => c.id === presetCustomerId)?.vehicles[0]
      : null;

  const [customerId, setCustomerId] = useState(initialCustomer);
  const [vehicleId, setVehicleId] = useState(doc?.vehicle_id ?? presetVehicle?.id ?? "");
  const [km, setKm] = useState(
    doc?.km != null ? String(doc.km) : presetVehicle?.km != null ? String(presetVehicle.km) : ""
  );
  const [items, setItems] = useState<Item[]>(doc?.items ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const customer = customers.find((c) => c.id === customerId);
  const vehicles = customer?.vehicles ?? [];
  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? null;

  const readOnly = Boolean(
    doc &&
      (doc.locked ||
        doc.status === "paid" ||
        doc.status === "accepted" ||
        doc.status === "cancelled")
  );
  const isOverdue = doc ? effectiveStatus(doc) === "overdue" : false;

  // Bestehende Belege behalten ihren eingefrorenen Steuersatz; neue folgen den Einstellungen.
  const vatRate = doc ? Number(doc.vat_rate) : defaultVatRate;
  const totals = useMemo(() => computeTotals(items, vatRate), [items, vatRate]);

  const setItem = (i: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const addItem = (t: ItemType) =>
    setItems((prev) => [
      ...prev,
      { type: t, desc: "", qty: 1, price: t === "labor" ? hourlyRate : 0 },
    ]);

  const onCustomerChange = (cid: string) => {
    setCustomerId(cid);
    const c = customers.find((x) => x.id === cid);
    const v = c?.vehicles[0];
    setVehicleId(v?.id ?? "");
    setKm(v?.km != null ? String(v.km) : "");
  };

  const onVehicleChange = (vid: string) => {
    setVehicleId(vid);
    const v = vehicles.find((x) => x.id === vid);
    setKm(v?.km != null ? String(v.km) : "");
  };

  const save = () =>
    startTransition(async () => {
      setError(null);
      const r = await saveDocumentAction({
        id: doc?.id ?? null,
        type,
        customer_id: customerId,
        vehicle_id: vehicleId,
        km,
        items,
      });
      if (r.error) {
        setError(r.error);
      } else if (r.ok) {
        // Direkt zum gespeicherten Beleg — dort warten PDF, Senden und Umwandeln
        router.push(
          `/belege/${r.id}?ok=${encodeURIComponent(`${noun} ${r.number} gespeichert`)}`
        );
      }
    });

  const selectCls =
    "w-full h-10 border border-[#e5e5e7] rounded-lg px-[11px] bg-white text-[14px] outline-none focus:border-[#0071e3] cursor-pointer disabled:cursor-default disabled:bg-[#fafafc] disabled:text-[#6e6e73]";
  const cellInput =
    "border border-transparent rounded-md h-8 px-2 text-[13.5px] outline-none bg-[#f5f5f7] focus:border-[#0071e3] focus:bg-white w-full";
  const cellTextarea =
    "border border-transparent rounded-md py-[6px] px-2 text-[13.5px] leading-5 outline-none bg-[#f5f5f7] focus:border-[#0071e3] focus:bg-white w-full resize-none overflow-hidden block";

  return (
    <div className="max-w-[1000px] mx-auto anim-fadein">
      <div className="flex items-center justify-between mb-3.5">
        <Link href={listPath} className="text-[13px] text-[#0071e3] hover:text-[#0060c9]">
          ← {type === "quote" ? "Zurück zu Angeboten" : "Zurück zu Rechnungen"}
        </Link>
      </div>

      {doc && (
        <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2.5">
          {/* Status links — schrumpft bei Bedarf (E-Mail wird mit … gekürzt), damit die Buttons Platz behalten */}
          <div className="flex items-center gap-2.5 min-w-0 md:flex-1">
            <StatusBadge doc={doc} />
            {doc.sent_at && (
              <span className="text-[12.5px] text-[#1d8a4e] font-medium truncate">
                ✓ Gesendet am {formatDateTime(doc.sent_at)} an {doc.sent_to}
              </span>
            )}
          </div>
          {/* Aktionen rechts — bleiben auf Desktop in EINER Zeile (md:flex-nowrap), stapeln nur mobil */}
          <div className="flex items-center gap-2.5 flex-wrap md:flex-nowrap shrink-0">
            <a
              href={`/api/belege/${doc.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="h-9 px-3.5 rounded-lg font-semibold text-[13px] inline-flex items-center gap-1.5 border border-[#e5e5e7] bg-white hover:border-[#0071e3] hover:text-[#0071e3] whitespace-nowrap"
            >
              PDF ansehen
            </a>
            <SendButton docId={doc.id} email={doc.customer?.email ?? ""} />
            {type === "quote" && doc.status !== "accepted" && (
              <ConfirmButton
                label="→ In Rechnung umwandeln"
                question="Rechnung erstellen?"
                variant="primary"
                action={async () => {
                  const r = await convertQuoteAction(doc.id);
                  if (r.error) return { error: r.error };
                  return {
                    redirectTo: `/belege/${r.invoiceId}?ok=${encodeURIComponent(
                      `Angebot in Rechnung ${r.number} umgewandelt`
                    )}`,
                  };
                }}
              />
            )}
            {type === "invoice" && doc.status === "open" && (
              <ConfirmButton
                label="✓ Als bezahlt markieren"
                question="Zahlung eingegangen?"
                action={() => markPaidAction(doc.id)}
              />
            )}
            {type === "invoice" && (doc.status === "open" || doc.status === "paid") && (
              <ConfirmButton
                label="Stornieren"
                question="Rechnung wirklich stornieren?"
                variant="danger"
                action={() => cancelInvoiceAction(doc.id)}
              />
            )}
            {!doc.sent_at && (doc.status === "draft" || doc.status === "open") && (
              <ConfirmButton
                label="Löschen"
                question="Wirklich löschen?"
                variant="danger"
                action={() => deleteDocumentAction(doc.id)}
              />
            )}
          </div>
        </div>
      )}

      {doc && doc.type === "invoice" && doc.status === "open" && (isOverdue || doc.reminder_level > 0) && (
        <div className="mb-4 rounded-[9px] bg-[#fdf8ec] border border-[#f0e2c0] px-4 py-3 flex items-center gap-2.5 flex-wrap">
          <span className="text-[13px] text-[#9a6a00] font-medium">
            {doc.reminder_level === 0
              ? "Diese Rechnung ist überfällig."
              : `${REMINDER_TITLE[doc.reminder_level]} erstellt am ${formatDateTime(doc.reminded_at)}.`}
          </span>
          <span className="flex-1" />
          {doc.reminder_level > 0 && (
            <a
              href={`/api/belege/${doc.id}/mahnung`}
              target="_blank"
              rel="noreferrer"
              className="h-9 px-3.5 rounded-lg font-semibold text-[13px] inline-flex items-center border border-[#e5e5e7] bg-white hover:border-[#0071e3] hover:text-[#0071e3]"
            >
              Mahnung ansehen
            </a>
          )}
          {doc.reminder_level > 0 && (
            <ReminderSendButton docId={doc.id} email={doc.customer?.email ?? ""} />
          )}
          {isOverdue && doc.reminder_level < 3 && (
            <ConfirmButton
              label={`${REMINDER_TITLE[doc.reminder_level + 1]} erstellen`}
              question={`${REMINDER_TITLE[doc.reminder_level + 1]} erstellen?`}
              variant="primary"
              action={() => createReminderAction(doc.id)}
            />
          )}
        </div>
      )}

      {doc?.status === "cancelled" && (
        <div className="mb-4 rounded-[9px] bg-[#fff2f1] border border-[#f3c4c0] px-4 py-3 flex items-center gap-2.5 flex-wrap">
          <span className="text-[13px] text-[#c9362b] font-medium">
            Diese Rechnung wurde am {formatDateTime(doc.cancelled_at)} storniert und ist
            gegenstandslos.
          </span>
          <span className="flex-1" />
          <ConfirmButton
            label="Als neue Rechnung kopieren"
            question="Korrektur-Rechnung erstellen?"
            variant="primary"
            action={async () => {
              const r = await duplicateInvoiceAction(doc.id);
              if (r.error) return { error: r.error };
              return {
                redirectTo: `/belege/${r.invoiceId}?ok=${encodeURIComponent(
                  `Rechnung ${r.number} als Korrektur erstellt`
                )}`,
              };
            }}
          />
        </div>
      )}

      {doc?.status === "accepted" && (
        <div className="mb-4 rounded-[9px] bg-[#f0f7f2] border border-[#c9e2d2] px-4 py-3 text-[13px] text-[#1d8a4e]">
          Dieses Angebot wurde angenommen und in{" "}
          {doc.converted_to && convertedNumber ? (
            <Link href={`/belege/${doc.converted_to}`} className="font-semibold underline">
              Rechnung {convertedNumber}
            </Link>
          ) : (
            "eine Rechnung"
          )}{" "}
          umgewandelt. Es ist deshalb schreibgeschützt.
        </div>
      )}
      {doc && doc.type === "invoice" && doc.locked && doc.status === "open" && (
        <div className="mb-4 rounded-[9px] bg-[#f5f8ff] border border-[#b9d4f5] px-4 py-3 text-[13px] text-[#0060c9]">
          Diese Rechnung wurde versendet und ist deshalb gesperrt — Änderungen sind nicht
          mehr möglich. Du kannst sie oben als bezahlt markieren.
        </div>
      )}
      {doc?.source_quote && sourceNumber && (
        <div className="mb-4 text-[12.5px] text-[#6e6e73]">
          Entstanden aus{" "}
          <Link href={`/belege/${doc.source_quote}`} className="text-[#0071e3] font-medium">
            Angebot {sourceNumber}
          </Link>
        </div>
      )}

      <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden">
        <div className="px-4 md:px-6 py-5 border-b border-[#ececf0] flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="text-[18px] font-bold tracking-[-0.3px]">
              {doc ? `${noun} bearbeiten` : `${noun} – Neu`}
            </div>
            <div className="text-[13px] text-[#86868b] font-mono mt-0.5">
              {doc ? doc.number : "Nummer wird beim Speichern vergeben"}
            </div>
          </div>
          <div className="font-mono text-[13px] text-[#6e6e73]">
            Datum: {formatDate(doc?.issue_date ?? todayISO())}
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="text-[14px] font-semibold mb-1.5">Noch keine Kunden angelegt</div>
            <div className="text-[13px] text-[#6e6e73] mb-4">
              Für ein {noun} brauchst du zuerst einen Kunden.
            </div>
            <Link
              href="/kunden/neu"
              className="inline-flex h-10 px-5 rounded-lg bg-[#0071e3] text-white font-semibold text-[14px] items-center hover:bg-[#0060c9]"
            >
              + Kunde anlegen
            </Link>
          </div>
        ) : (
          <>
            <div className="px-4 md:px-6 py-[18px] md:py-[22px] grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-[18px] border-b border-[#ececf0]">
              <div>
                <label className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">
                  Kunde
                </label>
                <select
                  value={customerId}
                  onChange={(e) => onCustomerChange(e.target.value)}
                  disabled={readOnly}
                  className={selectCls}
                >
                  <option value="">— Kunde wählen —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.company ? ` · ${c.company}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">
                  Fahrzeug
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => onVehicleChange(e.target.value)}
                  disabled={readOnly || !customer}
                  className={selectCls}
                >
                  <option value="">— Fahrzeug wählen —</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} — {v.model || "—"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {customer && !readOnly && !(customer.street && customer.zip && customer.city) && (
              <div className="px-4 md:px-6 py-2.5 bg-[#fdf8ec] border-b border-[#ececf0] text-[12.5px] text-[#9a6a00]">
                Für das PDF fehlt noch die Anschrift von {customer.name} —{" "}
                <Link
                  href={`/kunden/${customer.id}/bearbeiten`}
                  className="font-semibold underline"
                >
                  jetzt ergänzen
                </Link>
              </div>
            )}

            {vehicle && (
              <div className="px-4 md:px-6 py-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 bg-[#fafafc] border-b border-[#ececf0]">
                <div>
                  <div className="text-[11px] text-[#86868b] uppercase tracking-[0.4px] mb-[3px]">
                    Kennzeichen
                  </div>
                  <div className="font-mono font-semibold text-[14px]">{vehicle.plate}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#86868b] uppercase tracking-[0.4px] mb-[3px]">
                    VIN
                  </div>
                  <div className="font-mono text-[13px]">{vehicle.vin || "—"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#86868b] uppercase tracking-[0.4px] mb-[3px]">
                    KM-Stand
                  </div>
                  {readOnly ? (
                    <div className="font-mono text-[14px]">{km || "—"}</div>
                  ) : (
                    <input
                      value={km}
                      onChange={(e) => setKm(e.target.value)}
                      className="font-mono text-[14px] border border-[#e5e5e7] rounded-md h-[30px] w-[130px] px-2 outline-none focus:border-[#0071e3]"
                    />
                  )}
                </div>
                {vehicleDetails(vehicle) && (
                  <div className="col-span-2 sm:col-span-3 text-[12px] text-[#86868b] -mt-1">
                    {vehicleDetails(vehicle)}
                  </div>
                )}
              </div>
            )}

            <div className="px-4 md:px-6 py-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:flex-wrap mb-3 gap-2">
                <div className="font-semibold text-[14px]">Positionen</div>
                {!readOnly && (
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 items-stretch sm:items-center flex-1 sm:justify-end">
                    {products.length > 0 && (
                      <CatalogPicker
                        products={products}
                        onPick={(p) =>
                          setItems((prev) => [
                            ...prev,
                            {
                              type: p.type,
                              desc: p.name,
                              qty: Number(p.default_qty) || 1,
                              price: Number(p.price),
                            },
                          ])
                        }
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => addItem("labor")}
                      className="h-9 px-3 border border-[#e5e5e7] rounded-lg bg-white text-[12.5px] font-medium cursor-pointer hover:border-[#0071e3] hover:text-[#0071e3] shrink-0"
                    >
                      + Leere Zeile
                    </button>
                  </div>
                )}
              </div>

              <div className="border border-[#ececf0] rounded-[10px] overflow-hidden">
                <div className="overflow-x-auto">
                <div className="min-w-[660px]">
                <div className="grid grid-cols-[92px_1fr_128px_110px_110px_44px] gap-2 px-3.5 py-[9px] bg-[#fafafc] border-b border-[#ececf0] text-[11px] uppercase tracking-[0.4px] text-[#86868b] font-semibold">
                  <div>Art</div>
                  <div>Bezeichnung</div>
                  <div className="text-right">Menge</div>
                  <div className="text-right">Einzelpreis</div>
                  <div className="text-right">Summe</div>
                  <div></div>
                </div>

                {items.map((it, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[92px_1fr_128px_110px_110px_44px] gap-2 items-start px-3.5 py-2 border-b border-[#f0f0f3]"
                  >
                    {readOnly ? (
                      <span className="inline-block px-2 py-[3px] rounded-md text-[11px] font-semibold bg-[#f0f0f2] text-[#6e6e73] text-center">
                        {ITEM_TYPE_LABEL[it.type]}
                      </span>
                    ) : (
                      <select
                        value={it.type}
                        onChange={(e) => {
                          const t = e.target.value as ItemType;
                          setItem(i, {
                            type: t,
                            // Beim Wechsel auf Arbeitszeit den Stundensatz vorschlagen, falls noch kein Preis drinsteht
                            ...(t === "labor" && !it.price ? { price: hourlyRate } : {}),
                          });
                        }}
                        title="Art der Position"
                        className="h-8 w-full px-1 rounded-md text-[11px] font-semibold bg-[#f0f0f2] text-[#6e6e73] border border-transparent cursor-pointer outline-none hover:border-[#0071e3]"
                      >
                        <option value="labor">Arbeit</option>
                        <option value="part">Teil</option>
                        <option value="flat">Pausch.</option>
                      </select>
                    )}
                    {readOnly ? (
                      <div className="text-[13.5px] px-2 py-[6px] leading-5 whitespace-pre-wrap break-words">
                        {it.desc || "—"}
                      </div>
                    ) : (
                      <AutoGrowTextarea
                        value={it.desc}
                        onChange={(v) => setItem(i, { desc: v })}
                        placeholder={ITEM_PLACEHOLDER[it.type]}
                        className={cellTextarea}
                      />
                    )}
                    {readOnly ? (
                      <div className="text-[13.5px] text-right font-mono px-2 py-[6px] leading-5 whitespace-nowrap">
                        {it.qty}{" "}
                        <span className="text-[11px] text-[#86868b]">{ITEM_UNIT[it.type]}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                          value={it.qty}
                          onChange={(e) => setItem(i, { qty: parseFloat(e.target.value) || 0 })}
                          type="number"
                          step="0.1"
                          min="0"
                          className={`${cellInput} text-right font-mono`}
                        />
                        <span className="text-[11px] text-[#86868b] shrink-0 w-[42px]">
                          {ITEM_UNIT[it.type]}
                        </span>
                      </div>
                    )}
                    {readOnly ? (
                      <div className="text-[13.5px] text-right font-mono px-2 py-[6px] leading-5">
                        {euro(it.price)}
                      </div>
                    ) : (
                      <input
                        value={it.price}
                        onChange={(e) => setItem(i, { price: parseFloat(e.target.value) || 0 })}
                        type="number"
                        step="0.01"
                        min="0"
                        className={`${cellInput} text-right font-mono`}
                      />
                    )}
                    <div className="text-right font-mono font-semibold text-[13.5px] py-[6px] leading-5">
                      {euro(lineTotal(it))}
                    </div>
                    {!readOnly ? (
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-[#d2d2d7] hover:text-[#ff3b30] text-[16px] leading-5 py-[3px] cursor-pointer self-start"
                        title="Position entfernen"
                      >
                        ×
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="px-5 py-[22px] text-center text-[13px] text-[#86868b]">
                    Noch keine Positionen — oben aus dem Katalog wählen oder eine leere
                    Zeile einfügen.
                  </div>
                )}
                </div>
                </div>
              </div>

              <div className="flex justify-end mt-[18px]">
                <div className="w-[300px]">
                  {vatRate > 0 ? (
                    <>
                      <div className="flex justify-between py-1.5 text-[13.5px] text-[#6e6e73]">
                        <span>Zwischensumme (netto)</span>
                        <span className="font-mono">{euro(totals.net)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 text-[13.5px] text-[#6e6e73]">
                        <span>zzgl. {vatRate}% MwSt.</span>
                        <span className="font-mono">{euro(totals.vat)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="py-1.5 text-[12px] text-[#86868b]">
                      Keine Umsatzsteuer (§ 19 UStG)
                    </div>
                  )}
                  <div className="flex justify-between pt-3 mt-1.5 border-t border-[#e5e5e7] text-[16px] font-bold">
                    <span>Gesamt</span>
                    <span className="font-mono">{euro(totals.gross)}</span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mx-6 mb-4 rounded-[9px] bg-[#fff2f1] border border-[#f3c4c0] px-4 py-3 text-[13px] text-[#c9362b]">
                {error}
              </div>
            )}

            {!readOnly && (
              <div className="px-6 py-4 border-t border-[#ececf0] bg-[#fafafc] flex justify-end gap-2.5">
                <Link
                  href={listPath}
                  className="h-10 px-[18px] border border-[#e5e5e7] rounded-lg bg-white font-semibold text-[14px] inline-flex items-center hover:border-[#0071e3] hover:text-[#0071e3]"
                >
                  Abbrechen
                </Link>
                <button
                  type="button"
                  onClick={save}
                  disabled={pending}
                  className="h-10 px-[22px] rounded-lg bg-[#0071e3] text-white font-semibold text-[14px] cursor-pointer hover:bg-[#0060c9] disabled:opacity-60"
                >
                  {pending ? "Speichert…" : `${noun} speichern`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
