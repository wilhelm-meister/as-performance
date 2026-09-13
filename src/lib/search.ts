import type { Customer, Vehicle } from "./types";

function normalize(value: string): string {
  return value.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe")
    .replace(/ü/g, "ue").replace(/ß/g, "ss").normalize("NFKD")
    .replace(/\p{M}/gu, "");
}

/** All query terms must match; punctuation and spacing in identifiers are optional. */
export function matchesSearch(query: string, values: readonly (string | null | undefined)[]): boolean {
  const fields = values.filter((v): v is string => Boolean(v)).map(v => normalize(v).replace(/[^a-z0-9]/g, ""));
  const terms = normalize(query).split(/[^a-z0-9]+/).filter(Boolean);
  return terms.every(term => fields.some(field => field.includes(term)));
}

export function vehicleSearchValues(v: Vehicle): string[] {
  return [v.plate, v.model, v.vin, v.hsn ?? "", v.tsn ?? "", v.motor_code];
}

export function customerSearchValues(c: Customer & { vehicles?: Vehicle[] }): string[] {
  return [c.name, c.company, c.street, c.zip, c.city, c.phone, c.email,
    ...(c.vehicles ?? []).flatMap(vehicleSearchValues)];
}
