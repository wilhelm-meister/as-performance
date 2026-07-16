import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/data";
import { Topbar } from "@/components/Topbar";
import { VehicleForm } from "@/components/VehicleForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteVehicleAction } from "@/app/(app)/kunden/actions";

export default async function FahrzeugBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string; vid: string }>;
}) {
  const { id, vid } = await params;
  const customer = await getCustomer(id);
  const vehicle = customer?.vehicles.find((v) => v.id === vid);
  if (!customer || !vehicle) notFound();

  const deleteAction = deleteVehicleAction.bind(null, vid, id);

  return (
    <>
      <Topbar title={`${vehicle.plate} bearbeiten`} />
      <main className="flex-1 overflow-y-auto p-4 md:p-7">
        <div className="max-w-[720px] mx-auto anim-fadein">
          <Link
            href={`/kunden/${id}`}
            className="text-[13px] text-[#0071e3] hover:text-[#0060c9] inline-block mb-3.5"
          >
            ← Zurück zum Kunden
          </Link>
          <VehicleForm customerId={id} vehicle={vehicle} />

          <div className="mt-4 bg-white border border-[#e5e5e7] rounded-xl px-6 py-4 flex items-center justify-between">
            <div className="text-[13px] text-[#6e6e73]">
              Fahrzeug aus der Kartei entfernen — bestehende Belege bleiben erhalten.
            </div>
            <ConfirmButton
              label="Fahrzeug löschen"
              question="Wirklich löschen?"
              variant="danger"
              action={deleteAction}
            />
          </div>
        </div>
      </main>
    </>
  );
}
