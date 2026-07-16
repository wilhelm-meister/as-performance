import { notFound } from "next/navigation";
import { getDoc, getSettings, listCustomers, listProducts } from "@/lib/data";
import { docNoun } from "@/lib/format";
import { Topbar } from "@/components/Topbar";
import { OkBanner } from "@/components/OkBanner";
import { DocEditor } from "@/components/DocEditor";

export default async function BelegPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id } = await params;
  const { ok } = await searchParams;

  const doc = await getDoc(id);
  if (!doc) notFound();

  const [customers, settings, products, converted, source] = await Promise.all([
    listCustomers(),
    getSettings(),
    listProducts(),
    doc.converted_to ? getDoc(doc.converted_to) : Promise.resolve(null),
    doc.source_quote ? getDoc(doc.source_quote) : Promise.resolve(null),
  ]);

  return (
    <>
      <Topbar title={`${docNoun(doc.type)} ${doc.number}`}>
        <div />
      </Topbar>
      <main className="flex-1 overflow-y-auto p-4 md:p-7">
        <div className="max-w-[1000px] mx-auto">
          <OkBanner message={ok} />
        </div>
        <DocEditor
          doc={doc}
          docType={doc.type}
          customers={customers}
          products={products}
          hourlyRate={Number(settings?.hourly_rate ?? 89)}
          defaultVatRate={settings?.small_business ? 0 : 19}
          convertedNumber={converted?.number ?? null}
          sourceNumber={source?.number ?? null}
        />
      </main>
    </>
  );
}
