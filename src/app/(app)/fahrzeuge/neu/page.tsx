import Link from "next/link";
import { listCustomers } from "@/lib/data";
import { Topbar } from "@/components/Topbar";
import { NewVehicleFlow } from "@/components/NewVehicleFlow";

export default async function NeuesFahrzeugPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const { customer } = await searchParams;
  const customers = await listCustomers();
  const lean = customers.map((c) => ({ id: c.id, name: c.name, company: c.company }));

  return (
    <>
      <Topbar title="Neues Fahrzeug">
        <div />
      </Topbar>
      <main className="flex-1 overflow-y-auto p-4 md:p-7">
        <div className="max-w-[760px] mx-auto anim-fadein">
          <Link
            href="/fahrzeuge"
            className="text-[13px] text-[#0071e3] hover:text-[#0060c9] inline-block mb-3.5"
          >
            ← Zurück zu Fahrzeugen
          </Link>
          <NewVehicleFlow customers={lean} presetCustomerId={customer} />
        </div>
      </main>
    </>
  );
}
