"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import type { ProductFormState } from "@/app/(app)/produkte/actions";
import { saveProductAction } from "@/app/(app)/produkte/actions";

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isNew = !product;

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
            Position ein.
          </div>
        </div>

        <div className="px-6 py-[22px] grid grid-cols-1 sm:grid-cols-[150px_1fr_140px] gap-3.5">
          <div>
            <label className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">
              Art
            </label>
            <select
              name="type"
              defaultValue={v("type", product?.type ?? "part")}
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
              placeholder="z.B. Ölwechsel inkl. Filter"
              defaultValue={v("name", product?.name)}
              className={field}
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">
              Preis (€ netto)
            </label>
            <input
              name="price"
              required
              placeholder="89,00"
              defaultValue={v("price", product ? String(product.price) : "")}
              className={`${field} font-mono text-right`}
            />
          </div>
        </div>

        {state?.error && (
          <div className="mx-6 mb-4 rounded-[9px] bg-[#fff2f1] border border-[#f3c4c0] px-4 py-3 text-[13px] text-[#c9362b]">
            {state.error}
          </div>
        )}

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
