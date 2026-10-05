import { daysBetween, todayISO } from "./format";
import type { VehicleRow } from "./types";

export interface VehicleMetrics {
  sold: boolean;
  /** Preço de referência: venda real (se vendido) ou preço anunciado. */
  priceRef: number | null;
  /**
   * Custo efetivo: compra + custos; num consignado ainda não vendido, inclui o
   * repasse combinado com o dono (na venda, o repasse vira custo de verdade).
   */
  totalCost: number;
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
  const pendingRepasse = v.consignado === 1 && !sold && v.consignor_value != null ? v.consignor_value : 0;
  const totalCost = v.total_cost + pendingRepasse;
  const profit = priceRef != null ? priceRef - totalCost : null;
  const margin = priceRef != null && priceRef > 0 && profit != null ? profit / priceRef : null;
  const end = sold && v.sold_date ? v.sold_date : todayISO();
  const days = v.purchase_date ? daysBetween(v.purchase_date, end) : null;
  return { sold, priceRef, totalCost, profit, margin, days };
}

/** Rótulo curto "Honda HR-V EXL 1.5". */
export function vehicleLabel(v: { brand: string; model: string; version?: string | null }): string {
  return [v.brand, v.model, v.version].filter(Boolean).join(" ");
}
