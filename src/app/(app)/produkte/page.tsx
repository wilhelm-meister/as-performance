import Link from "next/link";
import { getSettings, listProducts } from "@/lib/data";
import { euro, ITEM_TYPE_LABEL, ITEM_UNIT } from "@/lib/format";
import { Topbar } from "@/components/Topbar";
import { OkBanner } from "@/components/OkBanner";

export default async function ProduktePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string }>;
}) {
  const { q, ok } = await searchParams;
  const [products, settings] = await Promise.all([listProducts(), getSettings()]);
  const nettoTag = settings?.small_business ? "" : " (netto)";

  const query = (q ?? "").trim().toLowerCase();
  const filtered = products.filter(
    (p) => !query || p.name.toLowerCase().includes(query)
  );

  return (
    <>
      <Topbar title="Produkte" search={q} searchAction="/produkte">
        <Link
          href="/produkte/neu"
          className="h-9 px-[15px] rounded-lg bg-[#0071e3] text-white font-semibold text-[13.5px] inline-flex items-center gap-[7px] hover:bg-[#0060c9]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline">Neues Produkt</span>
        </Link>
      </Topbar>
      <main className="flex-1 overflow-y-auto p-4 md:p-7">
        <div className="max-w-[1180px] mx-auto anim-fadein">
          <OkBanner message={ok} />

          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] text-[#6e6e73]">
              {filtered.length} {filtered.length === 1 ? "Produkt" : "Produkte"}
            </div>
          </div>

          <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[680px]">
                <div className="grid grid-cols-[100px_1fr_100px_130px_130px_50px] px-5 py-[11px] bg-[#fafafc] border-b border-[#ececf0] text-[11.5px] uppercase tracking-[0.4px] text-[#86868b] font-semibold">
                  <div>Art</div>
                  <div>Bezeichnung</div>
                  <div className="text-right">Menge</div>
                  <div className="text-right">Einzelpreis</div>
                  <div className="text-right">Gesamt{nettoTag}</div>
                  <div></div>
                </div>
                {filtered.map((p) => (
                  <Link
                    key={p.id}
                    href={`/produkte/${p.id}`}
                    className="grid grid-cols-[100px_1fr_100px_130px_130px_50px] items-center px-5 py-[13px] border-b border-[#f0f0f3] hover:bg-[#f5f5f7]"
                  >
                    <div>
                      <span className="inline-block px-2 py-[3px] rounded-md text-[11px] font-semibold bg-[#f0f0f2] text-[#6e6e73]">
                        {ITEM_TYPE_LABEL[p.type]}
                      </span>
                    </div>
                    <div className="text-[14px] font-medium truncate pr-3">{p.name}</div>
                    <div className="font-mono text-[13px] text-right text-[#6e6e73]">
                      {Number(p.default_qty).toLocaleString("de-DE")} {ITEM_UNIT[p.type]}
                    </div>
                    <div className="font-mono text-[13.5px] text-right">
                      {euro(Number(p.price))}
                    </div>
                    <div className="font-mono font-semibold text-[13.5px] text-right">
                      {euro(Number(p.default_qty) * Number(p.price))}
                    </div>
                    <div className="text-right text-[#d2d2d7]">→</div>
                  </Link>
                ))}
              </div>
            </div>
            {filtered.length === 0 && (
              <div className="px-5 py-10 text-center text-[13px] text-[#86868b]">
                {query ? (
                  "Kein Produkt passt zur Suche."
                ) : (
                  <>
                    Noch keine Produkte. Leg hier deine Standard-Leistungen und
                    -Teile an (z.B. &bdquo;Ölwechsel inkl. Filter&ldquo;) — im
                    Angebots- und Rechnungs-Editor fügst du sie dann mit einem
                    Klick ein.
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
