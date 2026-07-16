import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { ProductForm } from "@/components/ProductForm";

export default function NeuesProduktPage() {
  return (
    <>
      <Topbar title="Neues Produkt">
        <div />
      </Topbar>
      <main className="flex-1 overflow-y-auto p-4 md:p-7">
        <div className="max-w-[720px] mx-auto anim-fadein">
          <Link
            href="/produkte"
            className="text-[13px] text-[#0071e3] hover:text-[#0060c9] inline-block mb-3.5"
          >
            ← Zurück zu Produkten
          </Link>
          <ProductForm />
        </div>
      </main>
    </>
  );
}
