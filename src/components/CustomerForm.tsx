"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { Customer } from "@/lib/types";
import type { FormState } from "@/app/(app)/kunden/actions";
import { createCustomerAction, updateCustomerAction } from "@/app/(app)/kunden/actions";
import { VinLookupFields } from "./VinLookupFields";

function Field({
  label,
  name,
  placeholder,
  defaultValue,
  required,
  mono,
}: {
  label: React.ReactNode;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        className={`w-full h-10 border border-[#e5e5e7] rounded-lg px-3 text-[14px] outline-none focus:border-[#0071e3] bg-white ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}

export function CustomerForm({ customer }: { customer?: Customer }) {
  const router = useRouter();
  const isNew = !customer;

  const action = async (prev: FormState, fd: FormData) => {
    const r = isNew
      ? await createCustomerAction(prev, fd)
      : await updateCustomerAction(customer.id, prev, fd);
    if (r?.ok && r.id) {
      router.push(
        `/kunden/${r.id}?ok=${encodeURIComponent(isNew ? "Kunde angelegt" : "Änderungen gespeichert")}`
      );
    }
    return r;
  };

  const [state, formAction, pending] = useActionState(action, null);
  const v = (key: string, fallback = "") => state?.values?.[key] ?? fallback;

  return (
    <form action={formAction}>
      <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#ececf0]">
          <div className="text-[17px] font-bold">
            {isNew ? "Neuen Kunden anlegen" : "Kunden bearbeiten"}
          </div>
        </div>

        <div className="px-6 py-[22px] flex flex-col gap-4">
          {isNew ? (
            <>
              {/* Schnellanlage: nur das, was man am Tresen sicher weiß */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Name *" name="name" placeholder="Vor- und Nachname" required defaultValue={v("name")} />
                <Field label="Telefon" name="phone" placeholder="0170 …" defaultValue={v("phone")} />
                <Field label="Kennzeichen" name="plate" placeholder="VER-AS 123" mono defaultValue={v("plate")} />
              </div>

              <details className="group border-t border-[#ececf0] pt-4">
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden inline-flex items-center gap-2 text-[13px] font-semibold text-[#6e6e73] select-none hover:text-[#1a1d23]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-90">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Mehr Angaben — Adresse, E-Mail, Fahrzeugdaten
                </summary>
                <div className="pt-3.5 flex flex-col gap-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <Field label="Firma" name="company" placeholder="optional" defaultValue={v("company")} />
                    <Field label="E-Mail" name="email" placeholder="name@mail.de" defaultValue={v("email")} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <Field label="Straße und Hausnummer" name="street" placeholder="Musterstraße 12" defaultValue={v("street")} />
                    <div className="grid grid-cols-[110px_1fr] gap-3.5">
                      <Field label="PLZ" name="zip" placeholder="27299" defaultValue={v("zip")} />
                      <Field label="Ort" name="city" placeholder="Langwedel" defaultValue={v("city")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <Field label="KM-Stand" name="km" placeholder="85000" mono defaultValue={v("km")} />
                  </div>
                  <VinLookupFields
                    initial={{
                      vin: v("vin"),
                      model: v("model"),
                      year: v("year"),
                      fuel: v("fuel"),
                      engine: v("engine"),
                    }}
                  />
                </div>
              </details>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Name *" name="name" placeholder="Vor- und Nachname" required defaultValue={v("name", customer?.name)} />
                <Field label="Firma" name="company" placeholder="optional" defaultValue={v("company", customer?.company)} />
                <Field label="Telefon" name="phone" placeholder="0170 …" defaultValue={v("phone", customer?.phone)} />
                <Field label="E-Mail" name="email" placeholder="name@mail.de" defaultValue={v("email", customer?.email)} />
              </div>

              <div className="border-t border-[#ececf0] pt-4">
                <div className="text-[13px] font-semibold mb-3">
                  Anschrift{" "}
                  <span className="text-[#86868b] font-normal">(erscheint auf Rechnungen)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="Straße und Hausnummer" name="street" placeholder="Musterstraße 12" defaultValue={v("street", customer?.street)} />
                  <div className="grid grid-cols-[110px_1fr] gap-3.5">
                    <Field label="PLZ" name="zip" placeholder="28195" defaultValue={v("zip", customer?.zip)} />
                    <Field label="Ort" name="city" placeholder="Bremen" defaultValue={v("city", customer?.city)} />
                  </div>
                </div>
              </div>
            </>
          )}

          {state?.error && (
            <div className="rounded-[9px] bg-[#fff2f1] border border-[#f3c4c0] px-4 py-3 text-[13px] text-[#c9362b]">
              {state.error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#ececf0] bg-[#fafafc] flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-10 px-[18px] border border-[#e5e5e7] rounded-lg bg-white font-semibold text-[14px] cursor-pointer hover:border-[#0071e3] hover:text-[#0071e3]"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={pending}
            className="h-10 px-[22px] rounded-lg bg-[#0071e3] text-white font-semibold text-[14px] cursor-pointer hover:bg-[#0060c9] disabled:opacity-60"
          >
            {pending ? "Speichert…" : "Kunde speichern"}
          </button>
        </div>
      </div>
    </form>
  );
}
