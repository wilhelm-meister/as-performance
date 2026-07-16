import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/data";
import { Topbar } from "@/components/Topbar";
import { VehicleForm } from "@/components/VehicleForm";

export default async function NeuesFahrzeugPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <>
      <Topbar title={`Fahrzeug für ${customer.name}`} />
      <main className="flex-1 overflow-y-auto p-7">
        <div className="max-w-[720px] mx-auto anim-fadein">
          <Link
            href={`/kunden/${id}`}
            className="text-[13px] text-[#0071e3] hover:text-[#0060c9] inline-block mb-3.5"
          >
            ← Zurück zum Kunden
          </Link>
          <VehicleForm customerId={id} />
        </div>
      </main>
    </>
  );
}
