import Link from "next/link";
import { listDocs, listCustomers } from "@/lib/data";
import { matchesSearch } from "@/lib/search";
import { Topbar } from "@/components/Topbar";
import { OkBanner } from "@/components/OkBanner";
import { DocTable } from "@/components/DocTable";

export default async function RechnungenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string }>;
}) {
  const { q, ok } = await searchParams;
  const [docs, customers] = await Promise.all([listDocs(), listCustomers()]);
  const customerById = new Map(customers.map(c => [c.id, c]));

  const query = (q ?? "").trim().toLowerCase();
  const invoices = docs
    .filter((d) => d.type === "invoice")
    .filter((d) => {
      if (!query) return true;
      const c = customerById.get(d.customer_id);
      const v = c?.vehicles.find(v => v.id === d.vehicle_id);
      return matchesSearch(query, [d.number, d.customer?.name, d.customer?.company,
        d.vehicle?.plate, d.vehicle?.model, c?.zip, c?.city, c?.street, c?.phone,
        c?.email, v?.vin, v?.hsn, v?.tsn]);
    });

  return (
    <>
      <Topbar title="Rechnungen" search={q} searchAction="/rechnungen">
        <Link
          href="/belege/neu?type=invoice"
          className="h-11 sm:h-9 px-[15px] rounded-lg bg-[#0071e3] text-white font-semibold text-[13.5px] inline-flex items-center gap-[7px] hover:bg-[#0060c9]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline">Neue Rechnung</span>
        </Link>
      </Topbar>
      <main className="flex-1 overflow-y-auto p-4 md:p-7">
        <div className="max-w-[1180px] mx-auto anim-fadein">
          <OkBanner message={ok} />
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] text-[#6e6e73]">
              {invoices.length} {invoices.length === 1 ? "Rechnung" : "Rechnungen"}
            </div>
          </div>
          <DocTable docs={invoices} />
        </div>
      </main>
    </>
  );
}
