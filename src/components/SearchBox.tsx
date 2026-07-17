"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Live-Suche: filtert schon beim Tippen (kein Enter nötig).
 * Die Eingabe zeigt Getipptes sofort, die Navigation ist leicht entprellt,
 * damit nicht bei jedem Buchstaben der Server neu lädt. Enter geht weiter
 * (Formular-Fallback, funktioniert auch ohne JavaScript).
 */
export function SearchBox({ basePath, defaultValue }: { basePath: string; defaultValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue ?? "");
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const go = (raw: string) => {
    const q = raw.trim();
    const url = q ? `${basePath}?q=${encodeURIComponent(q)}` : basePath;
    startTransition(() => router.replace(url, { scroll: false }));
  };

  const onChange = (next: string) => {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => go(next), 220);
  };

  return (
    <form
      action={basePath}
      method="GET"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        go(value);
      }}
    >
      <svg
        className="absolute left-[11px] top-[9px] pointer-events-none"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke={pending ? "#0071e3" : "#86868b"}
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        name="q"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Suchen…"
        autoComplete="off"
        aria-label="Suchen"
        className="w-[140px] sm:w-[200px] lg:w-[280px] h-9 border border-[#e5e5e7] rounded-lg pl-[34px] pr-8 bg-[#f5f5f7] text-[13.5px] outline-none focus:border-[#0071e3]"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            if (timer.current) clearTimeout(timer.current);
            go("");
          }}
          title="Suche zurücksetzen"
          className="absolute right-[8px] top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-[#86868b] hover:bg-[#e5e5e7] hover:text-[#1d1d1f] text-[15px] leading-none cursor-pointer"
        >
          ×
        </button>
      )}
    </form>
  );
}
