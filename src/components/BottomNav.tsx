"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Untere Reiter-Leiste – nur auf dem Handy (md:hidden). Auf dem Desktop
 * übernimmt weiterhin die Sidebar. Fünf tägliche Ziele; Produkte und
 * Einstellungen sitzen oben rechts im „Mehr"-Menü (MoreMenu).
 */

const iconProps = {
  width: 23,
  height: 23,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Tab({
  href,
  active,
  label,
  icon,
  badge,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex-1 flex flex-col items-center justify-center gap-[3px] py-1.5 ${
        active ? "text-[#f5f5f7]" : "text-[#8e8e93]"
      }`}
    >
      <span className="relative">
        {icon}
        {badge && badge > 0 ? (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-[3px] rounded-full bg-[#ff3b30] text-white text-[9.5px] font-semibold flex items-center justify-center">
            {badge}
          </span>
        ) : null}
      </span>
      <span className={`text-[10px] leading-none ${active ? "font-semibold" : "font-medium"}`}>
        {label}
      </span>
    </Link>
  );
}

export function BottomNav({ overdueCount }: { overdueCount: number }) {
  const path = usePathname();

  return (
    <nav
      className="md:hidden shrink-0 bg-[#1d1d1f] border-t border-[#313135] flex items-stretch px-1 pt-1"
      style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
    >
      <Tab
        href="/"
        active={path === "/"}
        label="Start"
        icon={
          <svg {...iconProps}>
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
        }
      />
      <Tab
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
      <Tab
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
      <Tab
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
      <Tab
        href="/rechnungen"
        active={path.startsWith("/rechnungen")}
        label="Rechnungen"
        badge={overdueCount}
        icon={
          <svg {...iconProps}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        }
      />
    </nav>
  );
}
