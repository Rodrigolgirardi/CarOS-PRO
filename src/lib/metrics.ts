import { daysBetween, todayISO } from "./format";
import type { VehicleRow } from "./types";

export interface VehicleMetrics {
  sold: boolean;
  /** Preço de referência: venda real (se vendido) ou preço anunciado. */
  priceRef: number | null;
  /** Lucro real (vendido) ou potencial (estoque). Null quando não há preço. */
  profit: number | null;
  /** Margem sobre o preço de venda. */
  margin: number | null;
  /** Dias em estoque (até a venda, ou até hoje). */
  days: number | null;
}

export function vehicleMetrics(v: VehicleRow): VehicleMetrics {
  const sold = v.status === "vendido";
  const priceRef = sold ? (v.sold_price ?? v.sale_price) : v.sale_price;
  const profit = priceRef != null ? priceRef - v.total_cost : null;
  const margin = priceRef != null && priceRef > 0 && profit != null ? profit / priceRef : null;
  const end = sold && v.sold_date ? v.sold_date : todayISO();
  const days = v.purchase_date ? daysBetween(v.purchase_date, end) : null;
  return { sold, priceRef, profit, margin, days };
}

/** Rótulo curto "Honda HR-V EXL 1.5". */
export function vehicleLabel(v: { brand: string; model: string; version?: string | null }): string {
  return [v.brand, v.model, v.version].filter(Boolean).join(" ");
}
