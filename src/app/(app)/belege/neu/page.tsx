import { getSettings, listCustomers } from "@/lib/data";
import { docNoun } from "@/lib/format";
import { Topbar } from "@/components/Topbar";
import { DocEditor } from "@/components/DocEditor";

export default async function NeuerBelegPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; customer?: string }>;
}) {
  const { type, customer } = await searchParams;
  const docType = type === "invoice" ? "invoice" : "quote";

  const [customers, settings] = await Promise.all([listCustomers(), getSettings()]);

  return (
    <>
      <Topbar title={`Neues ${docNoun(docType)}`}>
        <div />
      </Topbar>
      <main className="flex-1 overflow-y-auto p-7">
        <DocEditor
          doc={null}
          docType={docType}
          customers={customers}
          hourlyRate={Number(settings?.hourly_rate ?? 89)}
          defaultVatRate={settings?.small_business ? 0 : 19}
          presetCustomerId={customer}
        />
      </main>
    </>
  );
}
