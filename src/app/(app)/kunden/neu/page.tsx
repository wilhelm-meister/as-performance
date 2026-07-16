import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { CustomerForm } from "@/components/CustomerForm";

export default function NeuerKundePage() {
  return (
    <>
      <Topbar title="Neuer Kunde" />
      <main className="flex-1 overflow-y-auto p-7">
        <div className="max-w-[720px] mx-auto anim-fadein">
          <Link href="/kunden" className="text-[13px] text-[#0071e3] hover:text-[#0060c9] inline-block mb-3.5">
            ← Zurück zu Kunden
          </Link>
          <CustomerForm />
        </div>
      </main>
    </>
  );
}
