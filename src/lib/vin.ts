// VIN-Dekodierung über die freie vPIC-Datenbank der NHTSA (kein API-Key nötig).
// Liefert weltweit zuverlässig Hersteller + Modelljahr; Modell/Motor sind bei
// EU-Fahrzeugen nicht immer vollständig — alle Felder bleiben editierbar.

export type VinData = {
  make: string;
  model: string;
  year: number | null;
  fuel: string;
  engine: string;
};

export function cleanVin(raw: string): string {
  return (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** 17 Zeichen, ohne I, O, Q (Norm ISO 3779) */
export function isValidVin(vin: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
}

const FUEL_MAP: Record<string, string> = {
  gasoline: "Benzin",
  diesel: "Diesel",
  electric: "Elektro",
  "flexible fuel vehicle (ffv)": "Benzin/E85",
  "compressed natural gas (cng)": "Erdgas (CNG)",
  "liquefied petroleum gas (propane or lpg)": "Autogas (LPG)",
  hydrogen: "Wasserstoff",
};

function mapFuel(raw: string): string {
  const key = raw.trim().toLowerCase();
  if (!key) return "";
  if (key.includes("plug-in")) return "Plug-in-Hybrid";
  if (key.includes("hybrid")) return "Hybrid";
  return FUEL_MAP[key] ?? raw.trim();
}

/** VOLKSWAGEN → Volkswagen, MERCEDES-BENZ → Mercedes-Benz, BMW bleibt BMW */
function niceMake(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split("-")
        .map((p) => (p.length <= 3 ? p : p[0] + p.slice(1).toLowerCase()))
        .join("-")
    )
    .join(" ");
}

function val(x: unknown): string {
  const s = typeof x === "string" ? x.trim() : "";
  return s && s.toLowerCase() !== "not applicable" ? s : "";
}

/**
 * FALLE: Der Modelljahr-Code (FIN-Position 10) wiederholt sich alle 30 Jahre
 * („D" = 1983 ODER 2013). Die NHTSA nutzt zur Unterscheidung eine US-Regel,
 * die für EU-Fahrzeuge nicht gilt — und rät dort oft die alte Runde.
 * Absurd alte Jahre (über 30 Jahre zurück) heben wir deshalb auf die moderne an.
 */
function plausibleYear(year: number): number {
  const now = new Date().getFullYear();
  let y = year;
  while (y < now - 30 && y + 30 <= now + 1) y += 30;
  return y;
}

export async function decodeVin(vin: string): Promise<VinData | null> {
  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
    { signal: AbortSignal.timeout(9000), cache: "no-store" }
  );
  if (!res.ok) return null;

  const json = (await res.json()) as { Results?: Array<Record<string, string>> };
  const r = json?.Results?.[0];
  if (!r) return null;

  const make = val(r.Make) ? niceMake(val(r.Make)) : "";
  const modelParts = [val(r.Model), val(r.Series)].filter(Boolean);
  const model = modelParts.filter((p, i) => modelParts.indexOf(p) === i).join(" ");

  const yearNum = parseInt(val(r.ModelYear), 10);
  const year = Number.isFinite(yearNum) && yearNum > 1950 ? plausibleYear(yearNum) : null;

  const engineParts: string[] = [];
  const displacement = parseFloat(val(r.DisplacementL));
  if (Number.isFinite(displacement) && displacement > 0) {
    engineParts.push(
      displacement.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " l"
    );
  }
  const cylinders = parseInt(val(r.EngineCylinders), 10);
  if (Number.isFinite(cylinders) && cylinders > 0) {
    engineParts.push(`${cylinders} Zyl.`);
  }
  const hp = parseFloat(val(r.EngineHP));
  if (Number.isFinite(hp) && hp > 0) {
    const kw = Math.round(hp * 0.7457);
    engineParts.push(`${kw} kW (${Math.round(kw / 0.7355)} PS)`);
  }

  return {
    make,
    model,
    year,
    fuel: mapFuel(val(r.FuelTypePrimary)),
    engine: engineParts.join(" · "),
  };
}
