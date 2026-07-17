"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { ITEM_TYPE_LABEL, ITEM_UNIT, euro } from "@/lib/format";
import {
  CATALOG_ORDER,
  catalogLabel,
  categorizeProduct,
} from "@/lib/catalog-category";

// Sortierung innerhalb einer Gruppe: erst die Arbeit (Pauschale/Stunden), dann Teile,
// jeweils alphabetisch — so steht z.B. „Ölwechsel" über „Motoröl"/„Ölfilter".
const TYPE_ORDER: Record<string, number> = { flat: 0, labor: 1, part: 2 };

function priceInfo(p: Product): string {
  if (p.type === "flat") return euro(Number(p.price));
  return `${Number(p.default_qty).toLocaleString("de-DE")} ${ITEM_UNIT[p.type]} × ${euro(Number(p.price))}`;
}

export function CatalogPicker({
  products,
  onPick,
}: {
  products: Product[];
  onPick: (p: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setLastAddedId(null);
  }, []);

  // Schließen bei Klick außerhalb oder Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // Beim Öffnen ins Suchfeld springen
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const buckets = new Map<string, Product[]>();
    for (const p of products) {
      if (q && !p.name.toLowerCase().includes(q)) continue;
      const key = categorizeProduct(p);
      const list = buckets.get(key) ?? [];
      list.push(p);
      buckets.set(key, list);
    }
    for (const list of buckets.values()) {
      list.sort(
        (a, b) => (TYPE_ORDER[a.type] - TYPE_ORDER[b.type]) || a.name.localeCompare(b.name, "de")
      );
    }
    return CATALOG_ORDER.filter((k) => buckets.has(k)).map((k) => ({
      key: k,
      label: catalogLabel(k),
      items: buckets.get(k)!,
    }));
  }, [products, query]);

  const pick = (p: Product) => {
    onPick(p);
    setLastAddedId(p.id);
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[210px] sm:max-w-[380px]"
    >
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        className="h-9 w-full px-3 border border-[#0071e3] text-[#0071e3] rounded-lg bg-white text-[13px] font-semibold cursor-pointer outline-none hover:bg-[#f5f8ff] flex items-center justify-between gap-2"
      >
        <span>+ Position aus Katalog wählen…</span>
        <span className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 z-30 mt-1.5 w-full sm:w-[360px] bg-white border border-[#e5e5e7] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.14)] overflow-hidden anim-popin">
          <div className="p-2.5 border-b border-[#ececf0]">
            <div className="relative">
              <svg
                className="absolute left-[10px] top-[10px] pointer-events-none"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#86868b"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Katalog durchsuchen…"
                aria-label="Katalog durchsuchen"
                className="w-full h-9 border border-[#e5e5e7] rounded-lg pl-[32px] pr-3 bg-[#f5f5f7] text-[13px] outline-none focus:border-[#0071e3]"
              />
            </div>
          </div>

          <div className="max-h-[min(60vh,420px)] overflow-y-auto py-1">
            {groups.length === 0 ? (
              <div className="px-4 py-6 text-center text-[13px] text-[#86868b]">
                Kein Produkt passt zur Suche.
              </div>
            ) : (
              groups.map((g) => (
                <div key={g.key}>
                  <div className="sticky top-0 bg-white px-3 pt-2.5 pb-1 text-[10.5px] uppercase tracking-[0.6px] text-[#86868b] font-semibold">
                    {g.label}
                  </div>
                  {g.items.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => pick(p)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#f5f8ff]"
                    >
                      <span className="inline-block px-1.5 py-[2px] rounded text-[10px] font-semibold bg-[#f0f0f2] text-[#6e6e73] shrink-0 w-[46px] text-center">
                        {ITEM_TYPE_LABEL[p.type]}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-medium truncate">{p.name}</span>
                        <span className="block text-[11.5px] text-[#86868b]">{priceInfo(p)}</span>
                      </span>
                      {lastAddedId === p.id ? (
                        <span className="text-[11px] font-semibold text-[#1d8a4e] shrink-0">
                          ✓ hinzugefügt
                        </span>
                      ) : (
                        <span className="text-[#0071e3] text-[17px] leading-none shrink-0">+</span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between px-3 py-2 border-t border-[#ececf0] bg-[#fafafc]">
            <span className="text-[11.5px] text-[#86868b]">Mehrere nacheinander möglich</span>
            <button
              type="button"
              onClick={close}
              className="h-8 px-3.5 rounded-lg bg-[#1d1d1f] text-white text-[12.5px] font-semibold cursor-pointer hover:bg-[#000]"
            >
              Fertig
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
