import type { DocWithRefs } from "@/lib/types";
import { euro, todayISO } from "@/lib/format";

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export function RevenueChart({ invoices, year }: { invoices: DocWithRefs[]; year: number }) {
  const monthly = MONTHS.map((m, i) => {
    const prefix = `${year}-${String(i + 1).padStart(2, "0")}`;
    const v = invoices
      .filter((d) => d.status === "paid" && (d.paid_at ?? "").startsWith(prefix))
      .reduce((a, d) => a + Number(d.gross_total), 0);
    return { m, v };
  });

  const curIdx = Number(todayISO().slice(5, 7)) - 1;
  const maxV = Math.max(...monthly.map((x) => x.v), 1);
  const vbW = 1100;
  const padX = 30;
  const yTop = 26;
  const yBot = 150;
  const xAt = (i: number) => padX + i * ((vbW - 2 * padX) / (monthly.length - 1));
  const yAt = (v: number) => yBot - (v / maxV) * (yBot - yTop);
  const pts = monthly.map((x, i) => ({ x: xAt(i), y: yAt(x.v) }));
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area =
    `M${pts[0].x.toFixed(1)},${yBot} L` +
    line.split(" ").join(" L") +
    ` L${pts[pts.length - 1].x.toFixed(1)},${yBot} Z`;

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
      <svg viewBox="0 0 1100 190" className="w-full h-[200px] block overflow-visible">
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0071e3" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#0071e3" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="30" y1="150" x2="1070" y2="150" stroke="#ececf0" strokeWidth="1" />
        <path d={area} fill="url(#revFill)" />
        <polyline
          points={line}
          fill="none"
          stroke="#0071e3"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {monthly.map((x, i) => {
          const active = i === curIdx;
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
              <text
                x={pts[i].x.toFixed(1)}
                y={(pts[i].y - 11).toFixed(1)}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight={active ? 600 : 500}
                fill={active ? "#0071e3" : "#6e6e73"}
                fontFamily="var(--font-plex-mono), monospace"
              >
                {(x.v / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })}k
              </text>
              <text
                x={pts[i].x.toFixed(1)}
                y="172"
                textAnchor="middle"
                fontSize="11"
                fill={active ? "#0071e3" : "#6e6e73"}
              >
                {x.m}
              </text>
            </g>
          );
        })}
      </svg>
      {total === 0 && (
        <div className="text-center text-[12.5px] text-[#86868b] mt-2">
          Noch keine bezahlten Rechnungen in {year} — die Kurve füllt sich von selbst.
        </div>
      )}
    </div>
  );
}
