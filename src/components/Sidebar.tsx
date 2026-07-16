"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { initials } from "@/lib/format";
import { signOutAction } from "@/app/(app)/actions";

const iconProps = {
  width: 17,
  height: 17,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function NavButton({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-[11px] px-3 py-[9px] rounded-lg text-[13.5px] w-full ${
        active
          ? "bg-[#2c2c2e] text-[#f5f5f7] font-semibold"
          : "text-[#a1a1a6] font-medium hover:text-[#f5f5f7]"
      }`}
    >
      {children}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10.5px] uppercase tracking-[0.8px] text-[#6e6e73] px-3 pt-3.5 pb-1.5 font-semibold">
      {children}
    </div>
  );
}

export function Sidebar({
  workshopName,
  ownerName,
  userEmail,
  customerCount,
  overdueCount,
}: {
  workshopName: string;
  ownerName: string;
  userEmail: string;
  customerCount: number;
  overdueCount: number;
}) {
  const path = usePathname();
  const displayName = ownerName || userEmail;

  return (
    <aside className="w-[248px] shrink-0 bg-[#1d1d1f] flex flex-col text-[#a1a1a6]">
      <div className="px-5 pt-[22px] pb-5 flex items-center gap-[11px] border-b border-[#313135]">
        <div className="w-[38px] h-[38px] rounded-[9px] bg-[#2c2c2e] flex items-center justify-center font-mono font-semibold text-[15px] text-white tracking-[-0.5px]">
          AS
        </div>
        <div>
          <div className="text-[#f5f5f7] font-semibold text-[15px] tracking-[-0.2px]">
            {workshopName}
          </div>
          <div className="text-[11px] text-[#6e6e73] tracking-[0.3px]">
            Werkstatt-Verwaltung
          </div>
        </div>
      </div>

      <nav className="px-3 py-3.5 flex flex-col gap-0.5 flex-1">
        <SectionLabel>Übersicht</SectionLabel>
        <NavButton href="/" active={path === "/"}>
          <svg {...iconProps}>
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
          Dashboard
        </NavButton>

        <SectionLabel>Verwaltung</SectionLabel>
        <NavButton href="/kunden" active={path.startsWith("/kunden")}>
          <svg {...iconProps}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Kunden
          <span className="ml-auto bg-[#2c2c2e] text-[#a1a1a6] text-[11px] font-semibold px-[7px] py-px rounded-[10px]">
            {customerCount}
          </span>
        </NavButton>
        <NavButton href="/angebote" active={path.startsWith("/angebote")}>
          <svg {...iconProps}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          Angebote
        </NavButton>
        <NavButton href="/rechnungen" active={path.startsWith("/rechnungen")}>
          <svg {...iconProps}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          Rechnungen
          {overdueCount > 0 && (
            <span className="ml-auto bg-[#ff3b30] text-white text-[11px] font-semibold px-[7px] py-px rounded-[10px]">
              {overdueCount}
            </span>
          )}
        </NavButton>

        <SectionLabel>System</SectionLabel>
        <NavButton href="/einstellungen" active={path.startsWith("/einstellungen")}>
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Einstellungen
        </NavButton>
      </nav>

      <div className="p-3.5 border-t border-[#313135] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#2c2c2e] flex items-center justify-center text-[12px] font-semibold text-[#d1d1d6]">
          {initials(displayName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[#f5f5f7] text-[13px] font-medium truncate">{displayName}</div>
          <div className="text-[11px] text-[#6e6e73] truncate">Inhaber</div>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            title="Abmelden"
            className="text-[#6e6e73] hover:text-[#f5f5f7] cursor-pointer p-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </form>
      </div>
    </aside>
  );
}
