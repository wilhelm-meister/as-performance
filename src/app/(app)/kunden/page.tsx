import Link from "next/link";
import { listCustomers, listDocs } from "@/lib/data";
import { euro, initials } from "@/lib/format";
import { Topbar } from "@/components/Topbar";
import { OkBanner } from "@/components/OkBanner";

export default async function KundenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string }>;
}) {
  const { q, ok } = await searchParams;
  const [customers, docs] = await Promise.all([listCustomers(), listDocs()]);

  const query = (q ?? "").trim().toLowerCase();
  const filtered = customers.filter((c) => {
    if (!query) return true;
    const hay = [c.name, c.company, c.email, c.phone, ...c.vehicles.map((v) => v.plate)]
      .join(" ")
      .toLowerCase();
    return hay.includes(query);
  });

  // „Umsatz" je Kunde = Summe aller bezahlten Rechnungen (wie die Zahl auf dem Dashboard)
  const revenueByCustomer = new Map<string, number>();
  for (const d of docs) {
    if (d.type === "invoice" && d.status === "paid") {
      revenueByCustomer.set(
        d.customer_id,
        (revenueByCustomer.get(d.customer_id) ?? 0) + Number(d.gross_total)
      );
    }
  }

  // Alphabetisch nach Name (kommt schon so aus der Datenbank), Umsatz nur als Info-Spalte
  const visible = filtered.map((c) => ({ c, revenue: revenueByCustomer.get(c.id) ?? 0 }));

  return (
    <>
      <Topbar title="Kunden" search={q} searchAction="/kunden">
        <Link
          href="/kunden/neu"
          className="h-11 sm:h-9 px-3 md:px-[15px] rounded-lg bg-[#0071e3] text-white font-semibold text-[13.5px] inline-flex items-center gap-[7px] hover:bg-[#0060c9] shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline">Neuer Kunde</span>
        </Link>
      </Topbar>
      <main className="flex-1 overflow-y-auto p-4 md:p-7">
        <div className="max-w-[1180px] mx-auto anim-fadein">
          <OkBanner message={ok} />

          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] text-[#6e6e73]">
              {filtered.length} {filtered.length === 1 ? "Kunde" : "Kunden"}
              {query ? ` für „${q}"` : ""}
            </div>
          </div>

          <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
            <div className="min-w-[760px]">
            <div className="grid grid-cols-[2fr_1.6fr_1.4fr_1fr_90px] px-5 py-[11px] bg-[#fafafc] border-b border-[#ececf0] text-[11.5px] uppercase tracking-[0.4px] text-[#86868b] font-semibold">
              <div>Kunde</div>
              <div>Kontakt</div>
              <div>Fahrzeuge</div>
              <div>Umsatz</div>
              <div></div>
            </div>
            {visible.map(({ c, revenue }) => {
              return (
                <Link
                  key={c.id}
                  href={`/kunden/${c.id}`}
                  className="grid grid-cols-[2fr_1.6fr_1.4fr_1fr_90px] items-center px-5 py-[13px] border-b border-[#f0f0f3] hover:bg-[#f5f5f7]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[9px] bg-[#f0f0f2] flex items-center justify-center text-[12.5px] font-semibold text-[#424245] shrink-0">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold truncate">{c.name}</div>
                      <div className="text-[12px] text-[#86868b] truncate">
                        {c.company || "Privatkunde"}
                      </div>
                    </div>
                  </div>
                  <div className="text-[13px] text-[#424245] min-w-0">
                    <div className="truncate">{c.phone || "—"}</div>
                    <div className="text-[#86868b] text-[12px] truncate">{c.email}</div>
                  </div>
                  <div className="text-[12.5px] font-mono text-[#424245]">
                    {c.vehicles.length
                      ? c.vehicles[0].plate +
                        (c.vehicles.length > 1 ? ` +${c.vehicles.length - 1}` : "")
                      : "—"}
                  </div>
                  <div
                    className="font-mono text-[13.5px] font-semibold"
                    style={{ color: revenue > 0 ? "#1d1d1f" : "#d2d2d7" }}
                  >
                    {revenue > 0 ? euro(revenue) : "—"}
                  </div>
                  <div className="text-right text-[#d2d2d7]">→</div>
                </Link>
              );
            })}
            </div>
            </div>
            {filtered.length === 0 && (
              <div className="px-5 py-10 text-center text-[13px] text-[#86868b]">
                {query
                  ? "Kein Kunde passt zur Suche."
                  : "Noch keine Kunden — leg oben rechts den ersten an."}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
