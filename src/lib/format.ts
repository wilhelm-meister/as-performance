import type { Doc, EffectiveStatus, ItemType } from "./types";

export function euro(n: number): string {
  return (n || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export function formatKm(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("de-DE") + " km";
}

/** ISO-Datum (yyyy-mm-dd) → 16.07.2026 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const dt = new Date(iso);
  return dt.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" }) +
    ", " + dt.toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" }) + " Uhr";
}

/** Heutiges Datum als yyyy-mm-dd in deutscher Zeit */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
}

export function initials(name: string | null | undefined): string {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Rechnungen mit überschrittenem Zahlungsziel gelten als überfällig. */
export function effectiveStatus(doc: Pick<Doc, "type" | "status" | "due_date">): EffectiveStatus {
  if (doc.type === "invoice" && doc.status === "open" && doc.due_date && doc.due_date < todayISO()) {
    return "overdue";
  }
  return doc.status;
}

export const STATUS_LABEL: Record<EffectiveStatus, string> = {
  draft: "Entwurf",
  sent: "Verschickt",
  accepted: "✓ Rechnung erstellt",
  open: "Offen",
  paid: "Bezahlt",
  cancelled: "Storniert",
  overdue: "Überfällig",
};

export const STATUS_COLOR: Record<EffectiveStatus, string> = {
  draft: "#6e6e73",
  sent: "#0071e3",
  accepted: "#1d8a4e",
  open: "#9a6a00",
  paid: "#1d8a4e",
  cancelled: "#6e6e73",
  overdue: "#c9362b",
};

/** Mahnstufen: Titel der Stufe (reminder_level 1–3) */
export const REMINDER_TITLE: Record<number, string> = {
  1: "Zahlungserinnerung",
  2: "1. Mahnung",
  3: "2. Mahnung",
};

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  labor: "Arbeit",
  part: "Teil",
  flat: "Pausch.",
};

export const ITEM_UNIT: Record<ItemType, string> = {
  labor: "Std.",
  part: "Stk.",
  flat: "pausch.",
};

export function docNoun(type: "quote" | "invoice"): string {
  return type === "quote" ? "Angebot" : "Rechnung";
}

/** „Baujahr 2019 · Diesel · 2,0 l · 110 kW (150 PS)" — nur vorhandene Angaben */
export function vehicleDetails(v: {
  year?: number | null;
  fuel?: string;
  engine?: string;
}): string {
  return [v.year ? `Baujahr ${v.year}` : "", v.fuel || "", v.engine || ""]
    .filter(Boolean)
    .join(" · ");
}
