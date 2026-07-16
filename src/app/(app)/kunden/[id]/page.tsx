import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer, listDocs } from "@/lib/data";
import { formatKm, initials, vehicleDetails } from "@/lib/format";
import { Topbar } from "@/components/Topbar";
import { OkBanner } from "@/components/OkBanner";
import { DocRowList } from "@/components/DocTable";
import { PlateChip } from "@/components/PlateChip";

export default async function KundenDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id } = await params;
  const { ok } = await searchParams;

  const [customer, docs] = await Promise.all([getCustomer(id), listDocs()]);
  if (!customer) notFound();

  const customerDocs = docs.filter((d) => d.customer_id === id);
  const contact = [customer.company, customer.phone, customer.email]
    .filter(Boolean)
    .join("  ·  ");
  const address = [customer.street, [customer.zip, customer.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <Topbar title="Kundendetails" />
      <main className="flex-1 overflow-y-auto p-7">
        <div className="max-w-[1180px] mx-auto anim-fadein">
          <Link href="/kunden" className="text-[13px] text-[#0071e3] hover:text-[#0060c9] inline-flex items-center gap-1 mb-3.5">
            ← Zurück zu Kunden
          </Link>

          <OkBanner message={ok} />

          <div className="bg-white border border-[#e5e5e7] rounded-xl px-6 py-[22px] mb-4 flex items-center gap-[18px]">
            <div className="w-14 h-14 rounded-xl bg-[#f0f0f2] flex items-center justify-center text-[19px] font-semibold text-[#424245] shrink-0">
              {initials(customer.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[20px] font-bold tracking-[-0.3px]">{customer.name}</div>
              <div className="text-[13.5px] text-[#6e6e73] mt-[3px] truncate">
                {contact || "Keine Kontaktdaten hinterlegt"}
              </div>
              {address && (
                <div className="text-[12.5px] text-[#86868b] mt-0.5">{address}</div>
              )}
            </div>
            <Link
              href={`/kunden/${id}/bearbeiten`}
              className="h-[38px] px-4 border border-[#e5e5e7] rounded-lg bg-white font-semibold text-[13.5px] inline-flex items-center hover:border-[#0071e3] hover:text-[#0071e3]"
            >
              Bearbeiten
            </Link>
            <Link
              href={`/belege/neu?type=quote&customer=${id}`}
              className="h-[38px] px-4 rounded-lg bg-[#0071e3] text-white font-semibold text-[13.5px] inline-flex items-center hover:bg-[#0060c9]"
            >
              + Angebot für Kunden
            </Link>
          </div>

          <div className="grid grid-cols-[1fr_1.5fr] gap-4">
            <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden self-start">
              <div className="px-5 py-[15px] border-b border-[#ececf0] flex items-center justify-between">
                <span className="font-semibold text-[14px]">Fahrzeuge</span>
                <Link
                  href={`/kunden/${id}/fahrzeuge/neu`}
                  className="text-[12.5px] font-semibold text-[#0071e3] hover:text-[#0060c9]"
                >
                  + Fahrzeug
                </Link>
              </div>
              {customer.vehicles.map((v) => (
                <Link
                  key={v.id}
                  href={`/kunden/${id}/fahrzeuge/${v.id}`}
                  className="block px-5 py-3.5 border-b border-[#f0f0f3] hover:bg-[#f5f5f7]"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <PlateChip plate={v.plate} />
                    <span className="text-[14px] font-semibold">{v.model || "—"}</span>
                  </div>
                  <div className="text-[12px] text-[#86868b] font-mono">
                    {v.vin ? `VIN ${v.vin}` : "VIN —"}  ·  {formatKm(v.km)}
                  </div>
                  {vehicleDetails(v) && (
                    <div className="text-[12px] text-[#86868b] mt-0.5">{vehicleDetails(v)}</div>
                  )}
                </Link>
              ))}
              {customer.vehicles.length === 0 && (
                <div className="px-5 py-7 text-center text-[13px] text-[#86868b]">
                  Noch kein Fahrzeug hinterlegt.
                </div>
              )}
            </div>

            <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden self-start">
              <div className="px-5 py-[15px] border-b border-[#ececf0] font-semibold text-[14px]">
                Vorgänge
              </div>
              {customerDocs.length > 0 ? (
                <DocRowList docs={customerDocs} showCustomer={false} />
              ) : (
                <div className="px-5 py-7 text-center text-[13px] text-[#86868b]">
                  Noch keine Vorgänge für diesen Kunden.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
