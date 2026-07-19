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
  label,
  icon,
  badge,
  mobileDot,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  mobileDot?: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      className={`relative flex items-center justify-center md:justify-start md:gap-[11px] px-0 md:px-3 py-3.5 md:py-[9px] rounded-lg text-[13.5px] w-full ${
        active
          ? "bg-[#2c2c2e] text-[#f5f5f7] font-semibold"
          : "text-[#a1a1a6] font-medium hover:text-[#f5f5f7]"
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
      {badge && <span className="hidden md:inline-flex ml-auto">{badge}</span>}
      {mobileDot && (
        <span className="md:hidden absolute top-1.5 right-2.5 w-2 h-2 rounded-full bg-[#ff3b30]" />
      )}
    </Link>
  );
}

function SectionLabel({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <>
      {/* Auf dem schmalen Handy-Rail (keine Labels) trennt eine dezente Linie die Gruppen */}
      {!first && <div className="md:hidden mx-2 my-2 h-px bg-[#313135]" />}
      <div className="hidden md:block text-[10.5px] uppercase tracking-[0.8px] text-[#6e6e73] px-3 pt-3.5 pb-1.5 font-semibold">
        {children}
      </div>
    </>
  );
}

export function Sidebar({
  workshopName,
  ownerName,
  userEmail,
  overdueCount,
}: {
  workshopName: string;
  ownerName: string;
  userEmail: string;
  overdueCount: number;
}) {
  const path = usePathname();
  const displayName = ownerName || userEmail;

  return (
    <aside className="hidden md:flex md:flex-col w-[248px] shrink-0 bg-[#1d1d1f] text-[#a1a1a6]">
      <div className="px-0 md:px-5 h-[60px] shrink-0 flex items-center justify-center md:justify-start gap-[11px] border-b border-[#313135]">
        <div className="w-[38px] h-[38px] rounded-[9px] bg-[#2c2c2e] flex items-center justify-center font-mono font-semibold text-[15px] text-white tracking-[-0.5px] shrink-0">
          AS
        </div>
        <div className="hidden md:block min-w-0">
          <div className="text-[#f5f5f7] font-semibold text-[15px] tracking-[-0.2px] truncate">
            {workshopName}
          </div>
          <div className="text-[11px] text-[#6e6e73] tracking-[0.3px]">
            Werkstatt-Verwaltung
          </div>
        </div>
      </div>

      <nav className="px-2 md:px-3 py-3.5 flex flex-col gap-0.5 flex-1">
        <SectionLabel first>Übersicht</SectionLabel>
        <NavButton
          href="/"
          active={path === "/"}
          label="Dashboard"
          icon={
            <svg {...iconProps}>
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
          }
        />

        <SectionLabel>Werkstatt</SectionLabel>
        <NavButton
          href="/fahrzeuge"
          active={path.startsWith("/fahrzeuge")}
          label="Fahrzeuge"
          icon={
            <svg {...iconProps}>
              <path d="M5 17h14M6.5 17l-1.2-4.5A2 2 0 0 1 7.2 10h9.6a2 2 0 0 1 1.9 2.5L17.5 17" />
              <path d="M5 11l1.2-3.6A2 2 0 0 1 8.1 6h7.8a2 2 0 0 1 1.9 1.4L19 11" />
              <circle cx="7.5" cy="17.5" r="1.5" />
              <circle cx="16.5" cy="17.5" r="1.5" />
            </svg>
          }
        />
        <NavButton
          href="/kunden"
          active={path.startsWith("/kunden")}
          label="Kunden"
          icon={
            <svg {...iconProps}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <SectionLabel>Abrechnung</SectionLabel>
        <NavButton
          href="/angebote"
          active={path.startsWith("/angebote")}
          label="Angebote"
          icon={
            <svg {...iconProps}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          }
        />
        <NavButton
          href="/rechnungen"
          active={path.startsWith("/rechnungen")}
          label="Rechnungen"
          mobileDot={overdueCount > 0}
          badge={
            overdueCount > 0 ? (
              <span className="bg-[#ff3b30] text-white text-[11px] font-semibold px-[7px] py-px rounded-[10px]">
                {overdueCount}
              </span>
            ) : undefined
          }
          icon={
            <svg {...iconProps}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          }
        />

        <SectionLabel>Katalog</SectionLabel>
        <NavButton
          href="/produkte"
          active={path.startsWith("/produkte")}
          label="Produkte"
          icon={
            <svg {...iconProps}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.29 7 12 12 20.71 7" />
              <line x1="12" y1="22" x2="12" y2="12" />
            </svg>
          }
        />

      </nav>

      <div className="px-2 md:px-3 pb-2">
        <NavButton
          href="/einstellungen"
          active={path.startsWith("/einstellungen")}
          label="Einstellungen"
          icon={
            <svg {...iconProps}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          }
        />
      </div>

      <div className="p-2 md:p-3.5 border-t border-[#313135] flex flex-col md:flex-row items-center gap-2 md:gap-2.5">
        <div
          className="w-8 h-8 rounded-full bg-[#2c2c2e] flex items-center justify-center text-[12px] font-semibold text-[#d1d1d6] shrink-0"
          title={displayName}
        >
          {initials(displayName)}
        </div>
        <div className="hidden md:block flex-1 min-w-0">
          <div className="text-[#f5f5f7] text-[13px] font-medium truncate">{displayName}</div>
          <div className="text-[11px] text-[#6e6e73] truncate">Inhaber</div>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            title="Abmelden"
            className="text-[#6e6e73] hover:text-[#f5f5f7] cursor-pointer p-2.5 md:p-1"
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
