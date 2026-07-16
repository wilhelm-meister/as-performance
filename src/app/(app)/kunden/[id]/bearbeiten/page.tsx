import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/data";
import { Topbar } from "@/components/Topbar";
import { CustomerForm } from "@/components/CustomerForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteCustomerAction } from "@/app/(app)/kunden/actions";

export default async function KundeBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const deleteAction = deleteCustomerAction.bind(null, id);

  return (
    <>
      <Topbar title="Kunden bearbeiten" />
      <main className="flex-1 overflow-y-auto p-7">
        <div className="max-w-[720px] mx-auto anim-fadein">
          <Link
            href={`/kunden/${id}`}
            className="text-[13px] text-[#0071e3] hover:text-[#0060c9] inline-block mb-3.5"
          >
            ← Zurück zum Kunden
          </Link>
          <CustomerForm customer={customer} />

          <div className="mt-4 bg-white border border-[#e5e5e7] rounded-xl px-6 py-4 flex items-center justify-between">
            <div className="text-[13px] text-[#6e6e73]">
              Kunde samt Fahrzeugen löschen — nur möglich, wenn keine Vorgänge existieren.
            </div>
            <ConfirmButton
              label="Kunde löschen"
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
