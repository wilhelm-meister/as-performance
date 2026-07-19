"use client";

import { useActionState } from "react";
import { sendMagicLink, verifyCode, type LoginState, type VerifyState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.ok && state.email) {
    return <CodeStep email={state.email} />;
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
        {pending ? "Wird gesendet…" : "Anmelde-Mail senden"}
      </button>
    </form>
  );
}

const initialVerify: VerifyState = null;

/** Zweiter Schritt: Code aus der Mail abtippen — geräteunabhängig. */
function CodeStep({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(verifyCode, initialVerify);

  return (
    <div className="anim-popin">
      <div className="rounded-[9px] bg-[#f0f7f2] border border-[#c9e2d2] px-4 py-3.5 text-[13.5px] text-[#1d8a4e] mb-4">
        <div className="font-semibold mb-0.5">✓ E-Mail ist unterwegs</div>
        Wir haben sie an <strong>{email}</strong> geschickt.
      </div>

      <form action={formAction} className="flex flex-col gap-3.5">
        <input type="hidden" name="email" value={email} />
        <div>
          <label htmlFor="code" className="text-[12px] font-semibold text-[#6e6e73] block mb-1.5">
            Code aus der E-Mail
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            required
            autoFocus
            placeholder="123456"
            className="w-full h-[52px] border border-[#e5e5e7] rounded-[9px] px-3 font-mono text-center text-[22px] tracking-[6px] outline-none focus:border-[#0071e3] bg-white"
          />
        </div>

        {state?.error && (
          <div className="rounded-[9px] bg-[#fff2f1] border border-[#f3c4c0] px-4 py-3 text-[13px] text-[#c9362b]">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="h-[42px] rounded-[9px] bg-[#0071e3] text-white font-semibold text-[14.5px] cursor-pointer hover:bg-[#0060c9] disabled:opacity-60 disabled:cursor-default"
        >
          {pending ? "Wird geprüft…" : "Anmelden"}
        </button>
      </form>

      <p className="text-[12px] text-[#86868b] mt-4 leading-relaxed">
        In der E-Mail steht auch ein Knopf zum Anklicken. Der funktioniert nur in
        genau diesem Browser — der Code hier funktioniert immer, auch wenn du die
        Mail auf einem anderen Gerät liest.
      </p>
    </div>
  );
}
