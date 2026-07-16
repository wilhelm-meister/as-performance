"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.ok) {
    return (
      <div className="rounded-[9px] bg-[#f0f7f2] border border-[#c9e2d2] px-4 py-4 text-[13.5px] text-[#1d8a4e] anim-popin">
        <div className="font-semibold mb-1">✓ Link ist unterwegs</div>
        Wir haben eine E-Mail an <strong>{state.email}</strong> geschickt. Klick dort
        auf den Anmelde-Link — er ist eine Stunde gültig.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div>
        <label htmlFor="email" className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">
          E-Mail-Adresse
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          placeholder="name@mail.de"
          className="w-full h-[42px] border border-[#e5e5e7] rounded-[9px] px-3 text-[14.5px] outline-none focus:border-[#0071e3] bg-white"
        />
      </div>

      {state.error && (
        <div className="rounded-[9px] bg-[#fff2f1] border border-[#f3c4c0] px-4 py-3 text-[13px] text-[#c9362b]">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-[42px] rounded-[9px] bg-[#0071e3] text-white font-semibold text-[14.5px] cursor-pointer hover:bg-[#0060c9] disabled:opacity-60 disabled:cursor-default"
      >
        {pending ? "Wird gesendet…" : "Anmelde-Link senden"}
      </button>
    </form>
  );
}
