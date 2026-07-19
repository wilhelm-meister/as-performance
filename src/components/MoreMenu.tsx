"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOutAction } from "@/app/(app)/actions";

/**
 * „Mehr"-Menü oben rechts – nur auf dem Handy (md:hidden). Nimmt die
 * Einrichtungs-Punkte auf, die nicht in die untere Reiter-Leiste passen:
 * Produkte, Einstellungen und Abmelden. Auf dem Desktop sitzen die in der
 * Sidebar; dort bleibt dieses Menü ausgeblendet.
 */

const gearIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const boxIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.29 7 12 12 20.71 7" />
    <line x1="12" y1="22" x2="12" y2="12" />
  </svg>
);

function Item({
  href,
  label,
  icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 text-[14.5px] ${
        active ? "text-[#0071e3] font-semibold" : "text-[#1d1d1f] font-medium"
      } hover:bg-[#f5f5f7]`}
    >
      <span className="text-[#86868b]">{icon}</span>
      {label}
    </Link>
  );
}

export function MoreMenu() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Mehr"
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-11 h-11 -mr-1.5 flex items-center justify-center rounded-lg text-[#1d1d1f] hover:bg-[#f2f2f2] active:bg-[#e8e8ea]"
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden="true" />
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 bg-white rounded-2xl border border-[#e5e5e7] py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.14)] overflow-hidden"
          >
            <Item href="/produkte" label="Produkte" icon={boxIcon} active={path.startsWith("/produkte")} onClick={close} />
            <Item href="/einstellungen" label="Einstellungen" icon={gearIcon} active={path.startsWith("/einstellungen")} onClick={close} />
            <div className="h-px bg-[#e5e5e7] my-1.5" />
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-3 text-[14.5px] font-medium text-[#ff3b30] hover:bg-[#fff2f1]"
              >
                <span className="text-[#ff3b30]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </span>
                Abmelden
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
