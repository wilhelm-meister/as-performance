"use client";

import { useId, useState } from "react";
import { matchesSearch } from "@/lib/search";

type Option = { id: string; label: string; detail?: string; search: string[] };

export function SearchSelect({ value, onChange, options, label, disabled = false }: {
  value: string; onChange: (id: string) => void; options: Option[]; label: string; disabled?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const selected = options.find(o => o.id === value);
  const results = options.filter(o => matchesSearch(query, [o.label, o.detail, ...o.search]));
  const choose = (next: string) => { onChange(next); setOpen(false); setQuery(""); setActive(-1); };

  return (
    <div className="relative min-w-0" onBlur={e => {
      if (!e.currentTarget.contains(e.relatedTarget)) { setOpen(false); setQuery(""); setActive(-1); }
    }}>
      <input
        role="combobox" aria-label={label} aria-expanded={open} aria-controls={`${id}-list`}
        aria-autocomplete="list" aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
        autoComplete="off" disabled={disabled}
        placeholder={`${label} suchen…`} value={open ? query : selected?.label ?? ""}
        onFocus={() => { setOpen(true); setQuery(""); setActive(-1); }}
        onClick={() => setOpen(true)}
        onChange={e => { setQuery(e.target.value); setOpen(true); setActive(-1); }}
        onKeyDown={e => {
          if (e.key === "Escape") { e.preventDefault(); setOpen(false); setQuery(""); setActive(-1); }
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault(); setOpen(true);
            const next = Math.max(0, Math.min(results.length - 1, active + (e.key === "ArrowDown" ? 1 : -1)));
            setActive(next);
            document.getElementById(`${id}-${next}`)?.scrollIntoView({ block: "nearest" });
          }
          if (e.key === "Enter") {
            e.preventDefault();
            if (open && results[active >= 0 ? active : 0]) choose(results[active >= 0 ? active : 0].id);
          }
        }}
        className="w-full h-11 border border-[#e5e5e7] rounded-lg pl-3 pr-11 bg-white text-[14px] outline-none focus:border-[#0071e3] disabled:bg-[#fafafc] disabled:text-[#6e6e73]"
      />
      {value && !disabled && <button type="button" aria-label={`${label} abwählen`} onClick={() => choose("")}
        className="absolute right-0 top-0 w-11 h-11 text-[#86868b]">×</button>}
      {open && !disabled && (
        <div id={`${id}-list`} role="listbox" aria-label={label}
          className="absolute z-30 top-full mt-1 w-full max-h-72 overflow-y-auto overscroll-contain rounded-xl border border-[#e5e5e7] bg-white shadow-lg">
          {results.map((o, index) => (
            <button type="button" role="option" id={`${id}-${index}`} key={o.id} aria-selected={o.id === value}
              tabIndex={-1} onMouseDown={e => e.preventDefault()} onClick={() => choose(o.id)}
              className={`block w-full text-left px-3 py-3 border-b border-[#f0f0f3] last:border-0 ${index === active ? "bg-[#eef5ff]" : "hover:bg-[#f5f5f7]"}`}>
              <span className="block text-[14px] font-semibold break-words">{o.label}</span>
              {o.detail && <span className="block text-[12px] text-[#6e6e73] break-words">{o.detail}</span>}
            </button>
          ))}
          {!results.length && <div className="p-3 text-[13px] text-[#6e6e73]" role="status">Keine Treffer. Andere Schreibweise, PLZ oder Kennzeichen versuchen.</div>}
        </div>
      )}
    </div>
  );
}
