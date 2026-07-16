"use client";

import { useActionState } from "react";
import {
  removeLogoAction,
  uploadLogoAction,
  type SettingsState,
} from "@/app/(app)/einstellungen/actions";
import { ConfirmButton } from "./ConfirmButton";

export function LogoCard({ logoUrl }: { logoUrl: string }) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(
    uploadLogoAction,
    null
  );

  return (
    <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-[#ececf0]">
        <div className="text-[16px] font-bold">Logo</div>
        <div className="text-[12.5px] text-[#86868b] mt-0.5">
          Erscheint oben links auf jedem Angebot und jeder Rechnung. PNG oder JPG,
          höchstens 2 MB — am besten mit weißem oder durchsichtigem Hintergrund.
        </div>
      </div>

      <div className="px-6 py-5 flex flex-col gap-4">
        {logoUrl ? (
          <div className="flex items-center gap-4 flex-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="Werkstatt-Logo"
              className="h-16 max-w-[240px] object-contain bg-[#fafafc] border border-[#ececf0] rounded-lg p-2"
            />
            <ConfirmButton
              label="Logo entfernen"
              question="Logo wirklich entfernen?"
              variant="danger"
              action={removeLogoAction}
            />
          </div>
        ) : (
          <div className="text-[13px] text-[#86868b]">Noch kein Logo hinterlegt.</div>
        )}

        <form action={formAction} className="flex items-center gap-2.5 flex-wrap">
          <input
            type="file"
            name="logo"
            required
            accept="image/png,image/jpeg"
            className="text-[13px] text-[#6e6e73] file:mr-3 file:h-9 file:px-3.5 file:rounded-lg file:border file:border-solid file:border-[#e5e5e7] file:bg-white file:font-semibold file:text-[13px] file:text-[#1a1d23] file:cursor-pointer hover:file:border-[#0071e3]"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-9 px-4 rounded-lg bg-[#0071e3] text-white font-semibold text-[13px] cursor-pointer hover:bg-[#0060c9] disabled:opacity-60"
          >
            {pending ? "Lädt hoch…" : logoUrl ? "Logo ersetzen" : "Logo hochladen"}
          </button>
        </form>

        {state?.error && (
          <div className="rounded-[9px] bg-[#fff2f1] border border-[#f3c4c0] px-4 py-3 text-[13px] text-[#c9362b]">
            {state.error}
          </div>
        )}
        {state?.ok && (
          <div className="rounded-[9px] bg-[#f0f7f2] border border-[#c9e2d2] px-4 py-3 text-[13px] text-[#1d8a4e] font-medium">
            ✓ Logo gespeichert — es erscheint ab sofort auf neuen PDFs.
          </div>
        )}
      </div>
    </div>
  );
}
