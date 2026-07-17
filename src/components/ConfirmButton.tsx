"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ActionResult = { ok?: boolean; error?: string; redirectTo?: string } | void;

export function ConfirmButton({
  label,
  question = "Sicher?",
  action,
  variant = "outline",
  className = "",
}: {
  label: React.ReactNode;
  question?: string;
  action: () => Promise<ActionResult>;
  variant?: "outline" | "danger" | "primary";
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const base =
    "h-9 px-3.5 rounded-lg font-semibold text-[13px] cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60";
  const styles = {
    outline: "border border-[#e5e5e7] bg-white hover:border-[#0071e3] hover:text-[#0071e3]",
    danger: "border border-[#e5e5e7] bg-white text-[#c9362b] hover:border-[#c9362b] hover:bg-[#fff2f1]",
    primary: "bg-[#0071e3] text-white hover:bg-[#0060c9]",
  };

  if (!armed) {
    return (
      <span className={className}>
        <button type="button" onClick={() => setArmed(true)} className={`${base} ${styles[variant]}`}>
          {label}
        </button>
        {error && <span className="ml-2 text-[12px] text-[#c9362b]">{error}</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 bg-[#f5f5f7] border border-[#e5e5e7] rounded-lg px-3 min-h-9 anim-popin ${className}`}
    >
      <span className="text-[12.5px] font-medium text-[#424245]">{question}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const r = await action();
            if (r && "error" in r && r.error) {
              setError(r.error);
              setArmed(false);
            } else if (r && "redirectTo" in r && r.redirectTo) {
              router.push(r.redirectTo);
            } else {
              setArmed(false);
              router.refresh();
            }
          })
        }
        className="text-[12.5px] font-semibold text-[#c9362b] cursor-pointer hover:underline disabled:opacity-50"
      >
        {pending ? "…" : "Ja"}
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
