"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import type { ItemType, Product } from "@/lib/types";
import type { ProductFormState } from "@/app/(app)/produkte/actions";
import { saveProductAction } from "@/app/(app)/produkte/actions";

export function ProductForm({
  product,
  hourlyRate,
}: {
  product?: Product;
  hourlyRate: number;
}) {
  const router = useRouter();
  const isNew = !product;

  const [type, setType] = useState<ItemType>(product?.type ?? "part");
  const [price, setPrice] = useState(product ? String(product.price) : "");

  const action = async (prev: ProductFormState, fd: FormData) => {
    const r = await saveProductAction(product?.id ?? null, prev, fd);
    if (r?.ok) {
      router.push(
        `/produkte?ok=${encodeURIComponent(isNew ? "Produkt angelegt" : "Produkt gespeichert")}`
      );
    }
    return r;
  };

  const [state, formAction, pending] = useActionState(action, null);
  const v = (key: string, fallback = "") => state?.values?.[key] ?? fallback;

  const onTypeChange = (t: ItemType) => {
    setType(t);
    // Bei Arbeitszeit den Stundensatz aus den Einstellungen vorschlagen
    if (t === "labor" && !price.trim()) {
      setPrice(String(hourlyRate));
    }
  };

  const qtyLabel = type === "labor" ? "Stunden" : type === "part" ? "Stück" : "Menge";
  const priceLabel = type === "labor" ? "Stundensatz (€ netto)" : "Preis (€ netto)";
  const qtyHint =
    type === "labor"
      ? "Wie lange dauert die Arbeit üblicherweise? Wird als Menge eingefügt."
      : "Vorgabe-Menge beim Einfügen — im Beleg jederzeit änderbar.";

  const field =
    "w-full h-10 border border-[#e5e5e7] rounded-lg px-3 text-[14px] outline-none focus:border-[#0071e3] bg-white";

  return (
    <form action={formAction}>
      <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#ececf0]">
          <div className="text-[17px] font-bold">
            {isNew ? "Neues Produkt anlegen" : "Produkt bearbeiten"}
          </div>
          <div className="text-[12.5px] text-[#86868b] mt-0.5">
            Produkte fügst du im Angebots- und Rechnungs-Editor mit einem Klick als
            fertige Position ein — inklusive Menge und Preis.
          </div>
        </div>

        <div className="px-6 py-[22px] flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-3.5">
            <div>
              <label className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">
                Art
              </label>
              <select
                name="type"
                value={type}
                onChange={(e) => onTypeChange(e.target.value as ItemType)}
                className={`${field} cursor-pointer`}
              >
                <option value="labor">Arbeitszeit</option>
                <option value="part">Ersatzteil</option>
                <option value="flat">Pauschale</option>
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">
                Bezeichnung *
              </label>
              <input
                name="name"
                required
                placeholder={
                  type === "labor" ? "z.B. Bremsen vorne erneuern" : "z.B. Bremsscheiben Satz"
                }
                defaultValue={v("name", product?.name)}
                className={field}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">
                {qtyLabel}
              </label>
              <input
                name="default_qty"
                placeholder={type === "labor" ? "1,5" : "1"}
                defaultValue={v(
                  "default_qty",
                  product ? String(product.default_qty) : "1"
                )}
                className={`${field} font-mono`}
              />
              <div className="text-[11.5px] text-[#86868b] mt-1">{qtyHint}</div>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">
                {priceLabel}
              </label>
              <input
                name="price"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={type === "labor" ? String(hourlyRate) : "49,90"}
                className={`${field} font-mono`}
              />
              {type === "labor" && (
                <div className="text-[11.5px] text-[#86868b] mt-1">
                  Dein Standard-Stundensatz: {hourlyRate} € — abweichender Satz möglich.
                </div>
              )}
            </div>
          </div>

          {state?.error && (
            <div className="rounded-[9px] bg-[#fff2f1] border border-[#f3c4c0] px-4 py-3 text-[13px] text-[#c9362b]">
              {state.error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#ececf0] bg-[#fafafc] flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => router.push("/produkte")}
            className="h-10 px-[18px] border border-[#e5e5e7] rounded-lg bg-white font-semibold text-[14px] cursor-pointer hover:border-[#0071e3] hover:text-[#0071e3]"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={pending}
            className="h-10 px-[22px] rounded-lg bg-[#0071e3] text-white font-semibold text-[14px] cursor-pointer hover:bg-[#0060c9] disabled:opacity-60"
          >
            {pending ? "Speichert…" : "Produkt speichern"}
          </button>
        </div>
      </div>
    </form>
  );
}
