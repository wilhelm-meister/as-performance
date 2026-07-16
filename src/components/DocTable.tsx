import Link from "next/link";
import type { DocWithRefs } from "@/lib/types";
import { euro, formatDate } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { DocQuickActions } from "./DocQuickActions";

function TypeIcon({ type }: { type: "quote" | "invoice" }) {
  return (
    <div className="w-8 h-8 shrink-0 rounded-lg bg-[#f0f0f2] text-[#6e6e73] flex items-center justify-center text-[12px] font-semibold font-mono">
      {type === "quote" ? "AN" : "RE"}
    </div>
  );
}

/** Kompakte Liste (Dashboard, Kundendetail) */
export function DocRowList({ docs, showCustomer = true }: { docs: DocWithRefs[]; showCustomer?: boolean }) {
  return (
    <>
      {docs.map((d) => (
        <Link
          key={d.id}
          href={`/belege/${d.id}`}
          className="px-5 py-[13px] border-b border-[#f0f0f3] flex items-center gap-3.5 hover:bg-[#f5f5f7]"
        >
          <TypeIcon type={d.type} />
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-medium truncate">
              {d.number}
              {showCustomer && d.customer ? ` · ${d.customer.name}` : ""}
            </div>
            <div className="text-[12px] text-[#86868b] truncate">
              {d.vehicle?.plate ?? "—"} · {formatDate(d.issue_date)}
            </div>
          </div>
          <StatusBadge doc={d} />
          <div className="font-mono font-semibold text-[13.5px] w-24 text-right">
            {euro(d.gross_total)}
          </div>
        </Link>
      ))}
    </>
  );
}

/** Volle Tabelle (Angebote / Rechnungen) */
export function DocTable({ docs }: { docs: DocWithRefs[] }) {
  return (
    <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden">
      <div className="grid grid-cols-[1.1fr_1.6fr_1.4fr_1fr_1fr_150px] px-5 py-[11px] bg-[#fafafc] border-b border-[#ececf0] text-[11.5px] uppercase tracking-[0.4px] text-[#86868b] font-semibold">
        <div>Nummer</div>
        <div>Kunde</div>
        <div>Fahrzeug</div>
        <div>Datum</div>
        <div>Betrag</div>
        <div>Status</div>
      </div>
      {docs.map((d) => (
        <Link
          key={d.id}
          href={`/belege/${d.id}`}
          className="grid grid-cols-[1.1fr_1.6fr_1.4fr_1fr_1fr_150px] items-center px-5 py-[13px] border-b border-[#f0f0f3] hover:bg-[#f5f5f7]"
        >
          <div className="font-mono font-semibold text-[13px]">{d.number}</div>
          <div className="text-[13.5px] font-medium truncate pr-2">
            {d.customer?.name ?? "—"}
          </div>
          <div className="text-[12.5px] font-mono text-[#6e6e73]">{d.vehicle?.plate ?? "—"}</div>
          <div className="text-[13px] text-[#6e6e73]">{formatDate(d.issue_date)}</div>
          <div className="font-mono font-semibold text-[13.5px]">{euro(d.gross_total)}</div>
          <div className="flex items-center gap-2">
            <StatusBadge doc={d} />
            <DocQuickActions doc={d} />
          </div>
        </Link>
      ))}
      {docs.length === 0 && (
        <div className="px-5 py-10 text-center text-[13px] text-[#86868b]">
          Noch keine Einträge.
        </div>
      )}
    </div>
  );
}
