import Link from "next/link";
import { notFound } from "next/navigation";
import { getVehicle, listDocs, vehicleDocSignedUrl } from "@/lib/data";
import { formatDate, formatKm, vehicleDetails } from "@/lib/format";
import { Topbar } from "@/components/Topbar";
import { OkBanner } from "@/components/OkBanner";
import { PlateChip } from "@/components/PlateChip";
import { DocRowList } from "@/components/DocTable";
import { ConfirmButton } from "@/components/ConfirmButton";
import { FahrzeugscheinViewer } from "@/components/FahrzeugscheinViewer";
import { deleteVehicleAction } from "@/app/(app)/fahrzeuge/actions";

const EMPTY = <span className="text-[#c7c7cc] font-normal">—</span>;

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-[0.6px] text-[#86868b] font-semibold mb-1">
        {label}
      </div>
      <div className="text-[14px] font-medium break-words">{children}</div>
    </div>
  );
}

export default async function FahrzeugDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id } = await params;
  const { ok } = await searchParams;

  const [vehicle, docs] = await Promise.all([getVehicle(id), listDocs()]);
  if (!vehicle) notFound();

  const vehicleDocs = docs.filter((d) => d.vehicle_id === id);
  const docUrl = await vehicleDocSignedUrl(vehicle.document_url);
  const schluessel = [vehicle.hsn, vehicle.tsn].filter(Boolean).join(" / ");

  return (
    <>
      <Topbar title="Fahrzeugdetails" />
      <main className="flex-1 overflow-y-auto p-4 md:p-7">
        <div className="max-w-[1180px] mx-auto anim-fadein">
          <Link
            href="/fahrzeuge"
            className="text-[13px] text-[#0071e3] hover:text-[#0060c9] inline-flex items-center gap-1 mb-3.5"
          >
            ← Zurück zu Fahrzeugen
          </Link>

          <OkBanner message={ok} />

          <div className="bg-white border border-[#e5e5e7] rounded-xl mb-4 overflow-hidden">
            <div className="px-4 md:px-6 py-[18px] md:py-[22px] flex items-center gap-3.5 md:gap-[18px] flex-wrap">
              <PlateChip plate={vehicle.plate || "—"} />
              <div className="flex-1 min-w-0">
                <div className="text-[20px] font-bold tracking-[-0.3px]">
                  {vehicle.model || "Fahrzeug"}
                </div>
                <div className="text-[13px] text-[#86868b] mt-[3px]">
                  {vehicleDetails(vehicle) || "Angelegt am " + formatDate(vehicle.created_at)}
                </div>
              </div>
              <Link
                href={`/fahrzeuge/${id}/bearbeiten`}
                className="h-11 sm:h-[38px] px-4 border border-[#e5e5e7] rounded-lg bg-white font-semibold text-[13.5px] inline-flex items-center hover:border-[#0071e3] hover:text-[#0071e3]"
              >
                Bearbeiten
              </Link>
            </div>

            <div className="px-4 md:px-6 py-4 border-t border-[#ececf0] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
              <Fact label="Kunde">
                {vehicle.customer ? (
                  <Link
                    href={`/kunden/${vehicle.customer.id}`}
                    className="text-[#0071e3] hover:text-[#0060c9]"
                  >
                    {vehicle.customer.name}
                  </Link>
                ) : (
                  EMPTY
                )}
              </Fact>
              <Fact label="FIN">
                <span className="font-mono text-[13px]">{vehicle.vin || EMPTY}</span>
              </Fact>
              <Fact label="Erstzulassung">
                {vehicle.first_registration ? formatDate(vehicle.first_registration) : vehicle.year || EMPTY}
              </Fact>
              <Fact label="KM-Stand">{vehicle.km != null ? formatKm(vehicle.km) : EMPTY}</Fact>
              <Fact label="Kraftstoff">{vehicle.fuel || EMPTY}</Fact>
              <Fact label="Motor">{vehicle.engine || EMPTY}</Fact>
              <Fact label="Motorcode / Kennbuchstabe">
                <span className="font-mono text-[13px]">{vehicle.motor_code || EMPTY}</span>
              </Fact>
              <Fact label="Schlüsselnummer (HSN/TSN)">
                <span className="font-mono text-[13px]">{schluessel || EMPTY}</span>
              </Fact>
              <Fact label="Baujahr">{vehicle.year || EMPTY}</Fact>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4">
            <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden self-start">
              <div className="px-5 py-[15px] border-b border-[#ececf0] font-semibold text-[14px]">
                Fahrzeugschein
              </div>
              {docUrl ? (
                <FahrzeugscheinViewer
                  url={docUrl}
                  rotation={vehicle.document_rotation}
                  vehicleId={id}
                />
              ) : (
                <div className="px-5 py-7 text-center text-[13px] text-[#86868b]">
                  Kein Fahrzeugschein-Foto hinterlegt.
                </div>
              )}
            </div>

            <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden self-start">
              <div className="px-5 py-[15px] border-b border-[#ececf0] font-semibold text-[14px]">
                Vorgänge
              </div>
              {vehicleDocs.length > 0 ? (
                <DocRowList docs={vehicleDocs} showCustomer />
              ) : (
                <div className="px-5 py-7 text-center text-[13px] text-[#86868b]">
                  Noch keine Angebote oder Rechnungen für dieses Fahrzeug.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <ConfirmButton
              label="Fahrzeug löschen"
              question="Fahrzeug wirklich löschen?"
              variant="danger"
              action={deleteVehicleAction.bind(null, id)}
            />
          </div>
        </div>
      </main>
    </>
  );
}
