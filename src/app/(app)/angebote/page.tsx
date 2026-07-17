import { listDocs } from "@/lib/data";
import { Topbar } from "@/components/Topbar";
import { OkBanner } from "@/components/OkBanner";
import { DocTable } from "@/components/DocTable";

export default async function AngebotePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string }>;
}) {
  const { q, ok } = await searchParams;
  const docs = await listDocs();

  const query = (q ?? "").trim().toLowerCase();
  const quotes = docs
    .filter((d) => d.type === "quote")
    .filter((d) => {
      if (!query) return true;
      const hay = [d.number, d.customer?.name ?? "", d.vehicle?.plate ?? ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });

  return (
    <>
      <Topbar title="Angebote" search={q} searchAction="/angebote" />
      <main className="flex-1 overflow-y-auto p-4 md:p-7">
        <div className="max-w-[1180px] mx-auto anim-fadein">
          <OkBanner message={ok} />
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] text-[#6e6e73]">
              {quotes.length} {quotes.length === 1 ? "Angebot" : "Angebote"}
            </div>
          </div>
          <DocTable docs={quotes} />
        </div>
      </main>
    </>
  );
}
