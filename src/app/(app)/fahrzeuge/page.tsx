import Link from "next/link";
import { listVehicles } from "@/lib/data";
import { vehicleDetails } from "@/lib/format";
import { Topbar } from "@/components/Topbar";
import { OkBanner } from "@/components/OkBanner";
import { PlateChip } from "@/components/PlateChip";

export default async function FahrzeugePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string }>;
}) {
  const { q, ok } = await searchParams;
  const vehicles = await listVehicles();

  const query = (q ?? "").trim().toLowerCase();
  const filtered = vehicles.filter((v) => {
    if (!query) return true;
    const hay = [v.plate, v.model, v.vin, v.hsn, v.tsn, v.customer?.name, v.customer?.company]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(query);
  });

  return (
    <>
      <Topbar title="Fahrzeuge" search={q} searchAction="/fahrzeuge">
        <Link
          href="/fahrzeuge/neu"
          className="h-11 sm:h-9 px-3 md:px-[15px] rounded-lg bg-[#0071e3] text-white font-semibold text-[13.5px] inline-flex items-center gap-[7px] hover:bg-[#0060c9] shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline">Neues Fahrzeug</span>
        </Link>
      </Topbar>
      <main className="flex-1 overflow-y-auto p-4 md:p-7">
        <div className="max-w-[1180px] mx-auto anim-fadein">
          <OkBanner message={ok} />

          <div className="text-[13px] text-[#6e6e73] mb-4">
            {filtered.length} {filtered.length === 1 ? "Fahrzeug" : "Fahrzeuge"}
            {query ? ` für „${q}"` : ""}
          </div>

          <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[740px]">
                <div className="grid grid-cols-[150px_1.5fr_1.3fr_1.2fr_40px] px-5 py-[11px] bg-[#fafafc] border-b border-[#ececf0] text-[11.5px] uppercase tracking-[0.4px] text-[#86868b] font-semibold">
                  <div>Kennzeichen</div>
                  <div>Fahrzeug</div>
                  <div>Kunde</div>
                  <div>FIN</div>
                  <div></div>
                </div>
                {filtered.map((v) => (
                  <Link
                    key={v.id}
                    href={`/fahrzeuge/${v.id}`}
                    className="grid grid-cols-[150px_1.5fr_1.3fr_1.2fr_40px] items-center px-5 py-[13px] border-b border-[#f0f0f3] hover:bg-[#f5f5f7]"
                  >
                    <div>
                      <PlateChip plate={v.plate || "—"} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold truncate flex items-center gap-2">
                        {v.model || "Fahrzeug"}
                        {v.document_url && (
                          <span
                            title="Fahrzeugschein hinterlegt"
                            className="text-[10px] font-semibold text-[#6e6e73] bg-[#f0f0f2] rounded px-1.5 py-px shrink-0"
                          >
                            Schein
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-[#86868b] truncate">
                        {vehicleDetails(v) || "—"}
                      </div>
                    </div>
                    <div className="text-[13px] text-[#424245] min-w-0 truncate">
                      {v.customer ? (
                        v.customer.name
                      ) : (
                        <span className="text-[#c7c7cc]">— kein Kunde —</span>
                      )}
                    </div>
                    <div className="font-mono text-[12px] text-[#424245] truncate min-w-0">
                      {v.vin ? v.vin : <span className="text-[#c7c7cc]">—</span>}
                    </div>
                    <div className="text-right text-[#d2d2d7]">→</div>
                  </Link>
                ))}
              </div>
            </div>
            {filtered.length === 0 && (
              <div className="px-5 py-10 text-center text-[13px] text-[#86868b]">
                {query
                  ? "Kein Fahrzeug passt zur Suche."
                  : "Noch keine Fahrzeuge — lege oben rechts das erste an."}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
