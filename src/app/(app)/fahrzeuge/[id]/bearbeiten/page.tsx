import Link from "next/link";
import { notFound } from "next/navigation";
import { getVehicle, listCustomers, vehicleDocSignedUrl } from "@/lib/data";
import { Topbar } from "@/components/Topbar";
import { VehicleEditor } from "@/components/VehicleEditor";

export default async function FahrzeugBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vehicle, customers] = await Promise.all([getVehicle(id), listCustomers()]);
  if (!vehicle) notFound();

  const lean = customers.map((c) => ({ id: c.id, name: c.name, company: c.company }));
  const docUrl = await vehicleDocSignedUrl(vehicle.document_url);

  return (
    <>
      <Topbar title="Fahrzeug bearbeiten">
        <div />
      </Topbar>
      <main className="flex-1 overflow-y-auto p-4 md:p-7">
        <div className="max-w-[760px] mx-auto anim-fadein">
          <Link
            href={`/fahrzeuge/${id}`}
            className="text-[13px] text-[#0071e3] hover:text-[#0060c9] inline-block mb-3.5"
          >
            ← Zurück zum Fahrzeug
          </Link>
          <VehicleEditor vehicle={vehicle} customers={lean} existingDocUrl={docUrl} />
        </div>
      </main>
    </>
  );
}
