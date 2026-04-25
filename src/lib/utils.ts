import type { Lote } from "@/tipos";

export const uid = (): string => Math.random().toString(36).slice(2, 10);

export const today = (): string => new Date().toISOString().slice(0, 10);

export const fmt = (n: number | null | undefined): string =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);

export const fmtN = (n: number | null | undefined, d = 1): string =>
  (n || 0).toFixed(d);

export const fmtDate = (iso: string): string => {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const fmtDateLong = (iso: string): string =>
  new Date(iso + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

export const startOfMonth = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;

export const daysAgo = (n: number, ref = new Date()): string =>
  new Date(ref.getTime() - n * 86400000).toISOString().slice(0, 10);

export const parseNumber = (raw: unknown): number => {
  if (typeof raw === "number") return raw;
  const cleaned = String(raw ?? "")
    .replace(/[^0-9.,-]/g, "")
    .replace(/\.(?=\d{3}(?:[,.\s]|$))/g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};

export const getStock = (productId: string, lots: Lote[]): number =>
  lots
    .filter((l) => l.productId === productId)
    .reduce((s, l) => s + l.qtyRemaining, 0);

export interface FifoResult {
  updatedLots: Lote[];
  avgCost: number;
  consumed: number;
}

export function fifoDeduct(
  productId: string,
  qty: number,
  lots: Lote[],
): FifoResult {
  let rem = qty;
  const sorted = lots
    .filter((l) => l.productId === productId && l.qtyRemaining > 0)
    .sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));
  const updated = lots.map((l) => ({ ...l }));
  let cost = 0;
  let consumed = 0;
  for (const lot of sorted) {
    if (rem <= 0) break;
    const idx = updated.findIndex((l) => l.id === lot.id);
    if (idx === -1) continue;
    const use = Math.min(rem, updated[idx].qtyRemaining);
    cost += use * updated[idx].costPerUnit;
    updated[idx].qtyRemaining -= use;
    rem -= use;
    consumed += use;
  }
  return {
    updatedLots: updated,
    avgCost: consumed > 0 ? cost / consumed : 0,
    consumed,
  };
}

export const cn = (...args: Array<string | false | null | undefined>): string =>
  args.filter(Boolean).join(" ");
