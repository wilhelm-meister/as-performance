import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/data";
import { Topbar } from "@/components/Topbar";
import { ProductForm } from "@/components/ProductForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteProductAction } from "@/app/(app)/produkte/actions";

export default async function ProduktBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const deleteAction = deleteProductAction.bind(null, id);

  return (
    <>
      <Topbar title="Produkt bearbeiten">
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
          <ProductForm product={product} />

          <div className="mt-4 bg-white border border-[#e5e5e7] rounded-xl px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-[13px] text-[#6e6e73]">
              Produkt aus dem Katalog entfernen — bestehende Belege bleiben unverändert.
            </div>
            <ConfirmButton
              label="Produkt löschen"
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
