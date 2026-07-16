import type { Item } from "./types";

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function lineTotal(it: Item): number {
  return round2((it.qty || 0) * (it.price || 0));
}

export function computeTotals(items: Item[], vatRate = 19) {
  const net = round2(items.reduce((s, it) => s + lineTotal(it), 0));
  const vat = round2((net * vatRate) / 100);
  const gross = round2(net + vat);
  return { net, vat, gross };
}
