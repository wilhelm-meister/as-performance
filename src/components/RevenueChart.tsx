import type { DocWithRefs } from "@/lib/types";
import { euro, todayISO } from "@/lib/format";

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

type Monthly = { m: string; v: number };

/**
 * Eine Chart-Variante. Wird zweimal gerendert:
 *  - Handy (schmale viewBox ~470): sonst quetscht sich die 1100er-viewBox auf
 *    ~300 px zusammen und die Monatsschrift landet bei ~3 px. Beträge über den
 *    Punkten werden hier weggelassen (unlesbar/zu eng), nur der aktuelle Monat
 *    bekommt seinen Wert.
 *  - Desktop (breite viewBox 1100): volle Darstellung mit allen Monatswerten.
 */
function ChartSvg({
  monthly,
  curIdx,
  vbW,
  monthFontSize,
  valueFontSize,
  valueLabels,
  strokeW,
  gradId,
  className,
}: {
  monthly: Monthly[];
  curIdx: number;
  vbW: number;
  monthFontSize: number;
  valueFontSize: number;
  valueLabels: "all" | "current";
  strokeW: number;
  gradId: string;
  className: string;
}) {
  const padX = vbW > 800 ? 30 : 22;
  const yTop = 26;
  const yBot = 150;
  const vbH = 190;
  const maxV = Math.max(...monthly.map((x) => x.v), 1);
  const xAt = (i: number) => padX + i * ((vbW - 2 * padX) / (monthly.length - 1));
  const yAt = (v: number) => yBot - (v / maxV) * (yBot - yTop);
  const pts = monthly.map((x, i) => ({ x: xAt(i), y: yAt(x.v) }));
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area =
    `M${pts[0].x.toFixed(1)},${yBot} L` +
    line.split(" ").join(" L") +
    ` L${pts[pts.length - 1].x.toFixed(1)},${yBot} Z`;

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} className={className}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0071e3" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#0071e3" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={padX} y1={yBot} x2={vbW - padX} y2={yBot} stroke="#ececf0" strokeWidth="1" />
      <path d={area} fill={`url(#${gradId})`} />
      <polyline
        points={line}
        fill="none"
        stroke="#0071e3"
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {monthly.map((x, i) => {
        const active = i === curIdx;
        const showVal = valueLabels === "all" || active;
        return (
          <g key={x.m}>
            <circle
              cx={pts[i].x.toFixed(1)}
              cy={pts[i].y.toFixed(1)}
              r={active ? 4.5 : 3}
              fill={active ? "#0071e3" : "#ffffff"}
              stroke="#0071e3"
              strokeWidth="2"
            />
            {showVal && (
              <text
                x={pts[i].x.toFixed(1)}
                y={(pts[i].y - 11).toFixed(1)}
                textAnchor="middle"
                fontSize={valueFontSize}
                fontWeight={active ? 600 : 500}
                fill={active ? "#0071e3" : "#6e6e73"}
                fontFamily="var(--font-plex-mono), monospace"
              >
                {(x.v / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })}k
              </text>
            )}
            <text
              x={pts[i].x.toFixed(1)}
              y={yBot + 22}
              textAnchor="middle"
              fontSize={monthFontSize}
              fontWeight={active ? 600 : 400}
              fill={active ? "#0071e3" : "#6e6e73"}
            >
              {x.m}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function RevenueChart({ invoices, year }: { invoices: DocWithRefs[]; year: number }) {
  const monthly: Monthly[] = MONTHS.map((m, i) => {
    const prefix = `${year}-${String(i + 1).padStart(2, "0")}`;
    const v = invoices
      .filter((d) => d.status === "paid" && (d.paid_at ?? "").startsWith(prefix))
      .reduce((a, d) => a + Number(d.gross_total), 0);
    return { m, v };
  });

  const curIdx = Number(todayISO().slice(5, 7)) - 1;
  const total = monthly.reduce((a, x) => a + x.v, 0);
  const prev = monthly[curIdx - 1]?.v ?? 0;
  const cur = monthly[curIdx]?.v ?? 0;
  const delta = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0;

  return (
    <div className="bg-white border border-[#e5e5e7] rounded-xl px-[22px] py-5 mb-4">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="font-semibold text-[14.5px]">Umsatzentwicklung</div>
          <div className="text-[12.5px] text-[#86868b] mt-0.5">
            Kalenderjahr {year} · gesamt {euro(total)}
          </div>
        </div>
        {prev > 0 && (
          <div
            className="text-[12.5px] font-semibold"
            style={{ color: delta >= 0 ? "#1d8a4e" : "#c9362b" }}
          >
            {delta >= 0 ? "+" : ""}
            {delta}% ggü. Vormonat
          </div>
        )}
      </div>

      {/* Handy: schmale viewBox → lesbare Monate; nur aktueller Monatswert */}
      <ChartSvg
        monthly={monthly}
        curIdx={curIdx}
        vbW={470}
        monthFontSize={17}
        valueFontSize={16}
        valueLabels="current"
        strokeW={3}
        gradId="revFillMobile"
        className="block md:hidden w-full h-auto overflow-visible"
      />

      {/* Desktop: breite viewBox, alle Monatswerte (unverändert) */}
      <ChartSvg
        monthly={monthly}
        curIdx={curIdx}
        vbW={1100}
        monthFontSize={11}
        valueFontSize={10.5}
        valueLabels="all"
        strokeW={2.5}
        gradId="revFillDesktop"
        className="hidden md:block w-full h-[200px] overflow-visible"
      />

      {total === 0 && (
        <div className="text-center text-[12.5px] text-[#86868b] mt-2">
          Noch keine bezahlten Rechnungen in {year} — die Kurve füllt sich von selbst.
        </div>
      )}
    </div>
  );
}
