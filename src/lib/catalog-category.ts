import type { ItemType } from "@/lib/types";

/**
 * Kategorien für das Katalog-Auswahlfenster im Beleg-Editor.
 *
 * Die Reihenfolge hier = Anzeige-Reihenfolge der Gruppen. Ein Produkt landet in
 * der ERSTEN Kategorie, deren `match` zutrifft — die Reihenfolge entscheidet also
 * bei Überschneidungen. Zuordnung passiert per Stichwort im Produktnamen, weil die
 * Produkte selbst kein Kategorie-Feld haben. Neue Stichwörter einfach ergänzen.
 */
export type CatalogCategory = {
  key: string;
  label: string;
  match: (nameLower: string, type: ItemType) => boolean;
};

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    key: "oel",
    label: "Ölwechsel",
    // Motoröl, Ölfilter und die Ölwechsel-Pauschale selbst.
    // (Der Namensanfang „ölwechsel" verhindert Fehlgriffe wie „…inkl. Ölwechsel".)
    match: (n) => /motoröl|ölfilter/.test(n) || n.startsWith("ölwechsel"),
  },
  {
    key: "zahnriemen",
    label: "Zahnriemen & Wasserpumpe",
    // Zahnriemen-Intervall + Wasserpumpe stehen meist zusammen auf der Rechnung,
    // inkl. Thermostat, Kühlmittel und Riemen.
    match: (n) =>
      /zahnriemen|wasserpumpe|keilrippenriemen|spannrolle|umlenkrolle|thermostat|kühler|frostschutz|kühlmittel|kühlsystem/.test(
        n
      ),
  },
  {
    key: "bremsen",
    label: "Bremsen",
    // Bremsbeläge/-scheiben-Intervall inkl. zugehöriger Teile.
    match: (n) => /brems/.test(n),
  },
  {
    key: "pauschale",
    label: "Arbeit & Service-Pauschalen",
    // Alle übrigen Arbeits-/Service-Positionen (Festpreis oder nach Stunden).
    match: (_n, type) => type === "flat" || type === "labor",
  },
];

export const CATALOG_FALLBACK = { key: "weitere", label: "Weitere Teile & Positionen" };

/** Reihenfolge aller Gruppen inkl. Auffang-Kategorie am Ende. */
export const CATALOG_ORDER = [...CATALOG_CATEGORIES.map((c) => c.key), CATALOG_FALLBACK.key];

export function catalogLabel(key: string): string {
  return CATALOG_CATEGORIES.find((c) => c.key === key)?.label ?? CATALOG_FALLBACK.label;
}

export function categorizeProduct(p: { name: string; type: ItemType }): string {
  const n = p.name.toLowerCase();
  for (const c of CATALOG_CATEGORIES) {
    if (c.match(n, p.type)) return c.key;
  }
  return CATALOG_FALLBACK.key;
}
