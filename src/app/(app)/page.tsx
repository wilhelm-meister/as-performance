import Link from "next/link";
import { getSettings, listCustomers, listDocs } from "@/lib/data";
import { euro, effectiveStatus, todayISO } from "@/lib/format";
import { Topbar } from "@/components/Topbar";
import { OkBanner } from "@/components/OkBanner";
import { DocRowList } from "@/components/DocTable";
import { RevenueChart } from "@/components/RevenueChart";

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-[#e5e5e7] rounded-xl px-5 py-[18px]">
      <div className="text-[12.5px] text-[#6e6e73] mb-2.5 flex items-center gap-[7px]">
        <span className="w-2 h-2 rounded-full bg-[#d2d2d7]" />
        {label}
      </div>
      <div className="text-[26px] font-bold font-mono tracking-[-1px]">{value}</div>
      <div className="text-[12px] text-[#86868b] mt-1">{sub}</div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  sub,
  icon,
}: {
  href: string;
  title: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="w-full text-left p-[13px] px-[15px] border border-[#e5e5e7] rounded-[9px] bg-white flex items-center gap-3 hover:border-[#0071e3] hover:bg-[#f5f8ff]"
    >
      <div className="w-[34px] h-[34px] rounded-lg bg-[#f0f0f2] text-[#1d1d1f] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[13.5px] font-semibold">{title}</div>
        <div className="text-[11.5px] text-[#86868b]">{sub}</div>
      </div>
    </Link>
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

  return (
    <>
      <Topbar title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-7">
        <div className="max-w-[1180px] mx-auto anim-fadein">
          <OkBanner message={ok} />

          <div className="grid grid-cols-4 gap-4 mb-6">
            <KpiCard
              label="Offene Forderungen"
              value={euro(openSum)}
              sub={`${openInvoices.length} offene Rechnungen${overdueCount > 0 ? ` · ${overdueCount} überfällig` : ""}`}
            />
            <KpiCard label="Umsatz (Monat)" value={euro(monthRevenue)} sub="bezahlte Rechnungen" />
            <KpiCard label="Offene Angebote" value={String(openQuotes)} sub="warten auf Antwort" />
            <KpiCard label="Kunden" value={String(customers.length)} sub="aktiv in der Kartei" />
          </div>

          <RevenueChart invoices={invoices} year={thisYear} />

          <div className="grid grid-cols-[1.6fr_1fr] gap-4">
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
                  Noch keine Vorgänge — leg links oben dein erstes Angebot an.
                </div>
              )}
            </div>

            <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden self-start">
              <div className="px-5 py-4 border-b border-[#ececf0] font-semibold text-[14.5px]">
                Schnellzugriff
              </div>
              <div className="p-[18px] px-4 flex flex-col gap-2.5">
                <QuickAction
                  href="/belege/neu?type=quote"
                  title="Angebot erstellen"
                  sub="Kostenvoranschlag anlegen"
                  icon={
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  }
                />
                <QuickAction
                  href="/belege/neu?type=invoice"
                  title="Rechnung erstellen"
                  sub="Direkt abrechnen"
                  icon={
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                    </svg>
                  }
                />
                <QuickAction
                  href="/kunden/neu"
                  title="Kunde anlegen"
                  sub="Neuen Kunden erfassen"
                  icon={
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                  }
                />
              </div>
            </div>
          </div>

          {!settings?.tax_number && (
            <div className="mt-4 rounded-xl border border-[#f0e2c0] bg-[#fdf8ec] px-5 py-4 text-[13px] text-[#9a6a00]">
              <strong>Tipp:</strong> Hinterlege unter{" "}
              <Link href="/einstellungen" className="underline font-semibold">
                Einstellungen
              </Link>{" "}
              deine Werkstatt-Stammdaten (Adresse, Steuernummer, IBAN) — sie erscheinen
              auf jedem Angebot und jeder Rechnung.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
