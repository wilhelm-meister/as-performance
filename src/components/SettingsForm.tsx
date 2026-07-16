"use client";

import { useActionState, useState } from "react";
import type { Settings } from "@/lib/types";
import { Toggle } from "@/components/Toggle";
import { updateSettingsAction, type SettingsState } from "@/app/(app)/einstellungen/actions";

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  mono,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  mono?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">{label}</label>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={`w-full h-10 border border-[#e5e5e7] rounded-lg px-3 text-[14px] outline-none focus:border-[#0071e3] bg-white ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(
    updateSettingsAction,
    null
  );
  const [smallBusiness, setSmallBusiness] = useState(settings.small_business);

  return (
    <form action={formAction}>
      <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#ececf0]">
          <div className="text-[16px] font-bold">Werkstatt-Stammdaten</div>
          <div className="text-[12.5px] text-[#86868b] mt-0.5">
            Diese Angaben erscheinen auf jedem Angebot und jeder Rechnung.
          </div>
        </div>

        <div className="px-6 py-[22px] flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="Werkstattname *" name="name" required defaultValue={settings.name} />
            <Field label="Inhaber" name="owner_name" placeholder="Vor- und Nachname" defaultValue={settings.owner_name} />
          </div>
          <div className="grid grid-cols-[2fr_110px_1fr] gap-3.5">
            <Field label="Straße und Hausnummer" name="street" defaultValue={settings.street} />
            <Field label="PLZ" name="zip" defaultValue={settings.zip} />
            <Field label="Ort" name="city" defaultValue={settings.city} />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="Telefon" name="phone" defaultValue={settings.phone} />
            <Field label="E-Mail (Antwortadresse)" name="email" defaultValue={settings.email} />
          </div>

          <div className="border-t border-[#ececf0] pt-4 grid grid-cols-2 gap-3.5">
            <Field label="Steuernummer" name="tax_number" defaultValue={settings.tax_number} />
            <Field label="USt-IdNr. (optional)" name="vat_id" defaultValue={settings.vat_id} />
          </div>

          <div className="border-t border-[#ececf0] pt-4">
            <input type="hidden" name="small_business" value={smallBusiness ? "true" : "false"} />
            <div className="flex items-start gap-3.5">
              <Toggle checked={smallBusiness} onChange={setSmallBusiness} />
              <div>
                <div className="text-[13.5px] font-semibold">
                  Kleinunternehmer (§ 19 UStG)
                </div>
                <p className="text-[12.5px] text-[#86868b] mt-0.5 leading-relaxed">
                  Neue Angebote und Rechnungen weisen keine Umsatzsteuer aus — der
                  Pflichthinweis &bdquo;Gemäß § 19 UStG wird keine Umsatzsteuer
                  berechnet&ldquo; erscheint automatisch auf jedem Beleg. Bereits
                  erstellte Belege bleiben unverändert.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#ececf0] pt-4 grid grid-cols-3 gap-3.5">
            <Field label="Bank" name="bank_name" defaultValue={settings.bank_name} />
            <Field label="IBAN" name="iban" mono defaultValue={settings.iban} />
            <Field label="BIC" name="bic" mono defaultValue={settings.bic} />
          </div>

          <div className="border-t border-[#ececf0] pt-4 grid grid-cols-3 gap-3.5">
            <Field
              label="Stundensatz (€ netto)"
              name="hourly_rate"
              mono
              defaultValue={String(settings.hourly_rate)}
            />
            <Field
              label="Zahlungsziel (Tage)"
              name="payment_days"
              mono
              defaultValue={String(settings.payment_days)}
            />
            <Field
              label="Angebote gültig (Tage)"
              name="quote_validity_days"
              mono
              defaultValue={String(settings.quote_validity_days)}
            />
          </div>

          {state?.error && (
            <div className="rounded-[9px] bg-[#fff2f1] border border-[#f3c4c0] px-4 py-3 text-[13px] text-[#c9362b]">
              {state.error}
            </div>
          )}
          {state?.ok && (
            <div className="rounded-[9px] bg-[#f0f7f2] border border-[#c9e2d2] px-4 py-3 text-[13px] text-[#1d8a4e] font-medium">
              ✓ Gespeichert
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#ececf0] bg-[#fafafc] flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="h-10 px-[22px] rounded-lg bg-[#0071e3] text-white font-semibold text-[14px] cursor-pointer hover:bg-[#0060c9] disabled:opacity-60"
          >
            {pending ? "Speichert…" : "Speichern"}
          </button>
        </div>
      </div>
    </form>
  );
}
