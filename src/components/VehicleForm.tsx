"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { Vehicle } from "@/lib/types";
import type { FormState } from "@/app/(app)/kunden/actions";
import { saveVehicleAction } from "@/app/(app)/kunden/actions";

export function VehicleForm({
  customerId,
  vehicle,
}: {
  customerId: string;
  vehicle?: Vehicle;
}) {
  const router = useRouter();
  const isNew = !vehicle;

  const action = async (prev: FormState, fd: FormData) => {
    const r = await saveVehicleAction(customerId, vehicle?.id ?? null, prev, fd);
    if (r?.ok) {
      router.push(
        `/kunden/${customerId}?ok=${encodeURIComponent(isNew ? "Fahrzeug angelegt" : "Fahrzeug gespeichert")}`
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
            {isNew ? "Fahrzeug hinzufügen" : "Fahrzeug bearbeiten"}
          </div>
        </div>

        <div className="px-6 py-[22px] grid grid-cols-2 gap-3.5">
          <div>
            <label className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">
              Kennzeichen *
            </label>
            <input
              name="plate"
              required
              placeholder="HB-AS 1234"
              defaultValue={v("plate", vehicle?.plate)}
              className={`${field} font-mono`}
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">
              Marke / Modell
            </label>
            <input
              name="model"
              placeholder="BMW 320d Touring"
              defaultValue={v("model", vehicle?.model)}
              className={field}
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">VIN</label>
            <input
              name="vin"
              placeholder="WBA…"
              defaultValue={v("vin", vehicle?.vin)}
              className={`${field} font-mono`}
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">
              KM-Stand
            </label>
            <input
              name="km"
              placeholder="85000"
              defaultValue={v("km", vehicle?.km != null ? String(vehicle.km) : "")}
              className={`${field} font-mono`}
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
            onClick={() => router.push(`/kunden/${customerId}`)}
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
