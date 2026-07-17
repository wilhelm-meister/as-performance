import Link from "next/link";
import { getSettings, listCustomers, listDocs } from "@/lib/data";
import { euro, effectiveStatus, todayISO } from "@/lib/format";
import { Topbar } from "@/components/Topbar";
import { OkBanner } from "@/components/OkBanner";
import { DocRowList } from "@/components/DocTable";
import { RevenueChart } from "@/components/RevenueChart";

function MiniKpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-[#e5e5e7] rounded-xl px-5 py-[18px]">
      <div className="text-[12.5px] text-[#6e6e73] mb-2.5 flex items-center gap-[7px]">
        <span className="w-2 h-2 rounded-full bg-[#d2d2d7]" />
        {label}
      </div>
      <div className="text-[22px] md:text-[26px] font-bold font-mono tracking-[-1px]">{value}</div>
      <div className="text-[12px] text-[#86868b] mt-1">{sub}</div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const [settings, customers, docs] = await Promise.all([
    getSettings(),
    listCustomers(),
    listDocs(),
  ]);

  const today = todayISO();
  const thisMonth = today.slice(0, 7);
  const thisYear = Number(today.slice(0, 4));

  const invoices = docs.filter((d) => d.type === "invoice");
  const openInvoices = invoices.filter((d) => d.status === "open");
  const openSum = openInvoices.reduce((a, d) => a + Number(d.gross_total), 0);
  const overdueCount = invoices.filter((d) => effectiveStatus(d) === "overdue").length;

  const monthRevenue = invoices
    .filter((d) => d.status === "paid" && (d.paid_at ?? "").startsWith(thisMonth))
    .reduce((a, d) => a + Number(d.gross_total), 0);

  const openQuotes = docs.filter(
    (d) => d.type === "quote" && (d.status === "draft" || d.status === "sent")
  ).length;

  const recent = docs.slice(0, 5);

  const satz =
    openInvoices.length === 0
      ? "Alles bezahlt — keine Rechnung wartet auf Geld."
      : `${
          openInvoices.length === 1
            ? "1 Rechnung wartet"
            : `${openInvoices.length} Rechnungen warten`
        } auf Zahlung${overdueCount > 0 ? ` — ${overdueCount} überfällig` : ""}.`;

  return (
    <>
      <Topbar title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-4 md:p-7">
        <div className="max-w-[1180px] mx-auto anim-fadein">
          <OkBanner message={ok} />

          {/* Eine große Zahl + ein großer Knopf */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-4 mb-3">
            <Link
              href="/rechnungen"
              className="bg-white border border-[#e5e5e7] rounded-xl px-6 py-6 block hover:border-[#0071e3]"
            >
              <div className="text-[13px] text-[#6e6e73] mb-2">Offene Forderungen</div>
              <div className="text-[38px] md:text-[46px] font-bold font-mono tracking-[-2px] leading-none">
                {euro(openSum)}
              </div>
              <div className="text-[14px] text-[#6e6e73] mt-3">{satz}</div>
            </Link>

            <Link
              href="/belege/neu?type=quote"
              className="bg-[#0071e3] text-white rounded-xl px-6 py-6 flex flex-col justify-center hover:bg-[#0060c9]"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="mb-2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <div className="text-[19px] font-bold">Neues Angebot</div>
              <div className="text-[12.5px] opacity-85 mt-1">
                Kunde wählen, Positionen aus dem Katalog — fertig.
              </div>
            </Link>
          </div>

          <div className="text-[13px] text-[#6e6e73] mb-5">
            Oder:{" "}
            <Link href="/belege/neu?type=invoice" className="text-[#0071e3] font-medium hover:text-[#0060c9]">
              Rechnung direkt erstellen
            </Link>
            {" · "}
            <Link href="/kunden/neu" className="text-[#0071e3] font-medium hover:text-[#0060c9]">
              Kunde anlegen
            </Link>
          </div>

          {/* Alles Weitere eingeklappt */}
          <details className="group">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#6e6e73] py-2 select-none hover:text-[#1a1d23]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-open:rotate-90"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              Mehr anzeigen — Umsatz, Kennzahlen, letzte Vorgänge
            </summary>

            <div className="pt-4 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <MiniKpi label="Umsatz (Monat)" value={euro(monthRevenue)} sub="bezahlte Rechnungen" />
                <MiniKpi label="Offene Angebote" value={String(openQuotes)} sub="warten auf Antwort" />
                <MiniKpi label="Kunden" value={String(customers.length)} sub="aktiv in der Kartei" />
              </div>

              <RevenueChart invoices={invoices} year={thisYear} />

              <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#ececf0] flex items-center justify-between">
                  <div className="font-semibold text-[14.5px]">Letzte Vorgänge</div>
                  <Link href="/rechnungen" className="text-[13px] text-[#0071e3] hover:text-[#0060c9]">
                    Alle ansehen →
                  </Link>
                </div>
                {recent.length > 0 ? (
                  <DocRowList docs={recent} />
                ) : (
                  <div className="px-5 py-10 text-center text-[13px] text-[#86868b]">
                    Noch keine Vorgänge — oben dein erstes Angebot anlegen.
                  </div>
                )}
              </div>
            </div>
          </details>

          {!settings?.tax_number && (
            <div className="mt-4 rounded-xl border border-[#f0e2c0] bg-[#fdf8ec] px-5 py-4 text-[13px] text-[#9a6a00]">
              <strong>Tipp:</strong> Hinterlege unter{" "}
              <Link href="/einstellungen" className="underline font-semibold">
                Einstellungen
              </Link>{" "}
              deine Werkstatt-Stammdaten (Adresse, Steuernummer, Bankverbindung) — sie
              erscheinen auf jedem Angebot und jeder Rechnung.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
