import { getSettings, listCustomers, listProducts } from "@/lib/data";
import { Topbar } from "@/components/Topbar";
import { DocEditor } from "@/components/DocEditor";

export default async function NeuerBelegPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; customer?: string }>;
}) {
  const { type, customer } = await searchParams;
  const docType = type === "invoice" ? "invoice" : "quote";

  const [customers, settings, products] = await Promise.all([
    listCustomers(),
    getSettings(),
    listProducts(),
  ]);

  return (
    <>
      <Topbar title={docType === "invoice" ? "Neue Rechnung" : "Neues Angebot"}>
        <div />
      </Topbar>
      <main className="flex-1 overflow-y-auto p-4 md:p-7">
        <DocEditor
          doc={null}
          docType={docType}
          customers={customers}
          products={products}
          hourlyRate={Number(settings?.hourly_rate ?? 89)}
          defaultVatRate={settings?.small_business ? 0 : 19}
          presetCustomerId={customer}
        />
      </main>
    </>
  );
}
