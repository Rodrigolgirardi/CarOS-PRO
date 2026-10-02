import { addDaysISO, daysBetween, monthStartISO, todayISO } from "../format";
import { vehicleMetrics } from "../metrics";
import type { VehicleRow } from "../types";
import { listVehicles } from "./vehicles";

export type Period = "mes" | "30" | "ano" | "tudo";

export function periodStart(period: Period): string | null {
  const today = todayISO();
  if (period === "mes") return monthStartISO();
  if (period === "30") return addDaysISO(today, -30);
  if (period === "ano") return `${today.slice(0, 4)}-01-01`;
  return null;
}

export const PERIOD_LABEL: Record<Period, string> = {
  mes: "Este mês",
  "30": "Últimos 30 dias",
  ano: "Este ano",
  tudo: "Tudo",
};

// ------------------------------------------------------------------ estoque

export interface StockReport {
  rows: VehicleRow[];
  count: number;
  invested: number;
  saleValue: number;
  potentialProfit: number;
  avgDays: number | null;
  byStatus: { status: string; n: number; invested: number }[];
}

export function stockReport(): StockReport {
  const rows = listVehicles("estoque");
  let invested = 0;
  let saleValue = 0;
  let potentialProfit = 0;
  let daysSum = 0;
  let daysCount = 0;
  const statusMap = new Map<string, { n: number; invested: number }>();
  for (const v of rows) {
    const m = vehicleMetrics(v);
    invested += v.total_cost;
    if (v.sale_price != null) saleValue += v.sale_price;
    if (m.profit != null) potentialProfit += m.profit;
    if (m.days != null) {
      daysSum += m.days;
      daysCount++;
    }
    const s = statusMap.get(v.status) ?? { n: 0, invested: 0 };
    s.n++;
    s.invested += v.total_cost;
    statusMap.set(v.status, s);
  }
  // ordenados por dias em estoque (mais antigos primeiro)
  const sorted = [...rows].sort((a, b) => (vehicleMetrics(b).days ?? 0) - (vehicleMetrics(a).days ?? 0));
  return {
    rows: sorted,
    count: rows.length,
    invested,
    saleValue,
    potentialProfit,
    avgDays: daysCount ? Math.round(daysSum / daysCount) : null,
    byStatus: [...statusMap.entries()].map(([status, v]) => ({ status, ...v })),
  };
}

// ------------------------------------------------------------------- vendas

export interface SaleReportRow extends VehicleRow {
  profit: number | null;
  margin: number | null;
  daysToSell: number | null;
}

export interface SalesReport {
  rows: SaleReportRow[];
  count: number;
  revenue: number;
  profit: number;
  margin: number | null;
  avgTicket: number | null;
  avgDaysToSell: number | null;
}

export function salesReport(period: Period): SalesReport {
  const from = periodStart(period);
  const sold = listVehicles("vendido").filter((v) => v.sold_date && (!from || v.sold_date >= from));
  const rows: SaleReportRow[] = sold.map((v) => {
    const m = vehicleMetrics(v);
    return {
      ...v,
      profit: m.profit,
      margin: m.margin,
      daysToSell: v.purchase_date && v.sold_date ? daysBetween(v.purchase_date, v.sold_date) : null,
    };
  });
  rows.sort((a, b) => ((a.sold_date ?? "") < (b.sold_date ?? "") ? 1 : -1));
  const revenue = rows.reduce((acc, r) => acc + (r.sold_price ?? 0), 0);
  const profit = rows.reduce((acc, r) => acc + (r.profit ?? 0), 0);
  const daysVals = rows.map((r) => r.daysToSell).filter((d): d is number => d != null);
  return {
    rows,
    count: rows.length,
    revenue,
    profit,
    margin: revenue > 0 ? profit / revenue : null,
    avgTicket: rows.length ? Math.round(revenue / rows.length) : null,
    avgDaysToSell: daysVals.length ? Math.round(daysVals.reduce((a, b) => a + b, 0) / daysVals.length) : null,
  };
}

// ------------------------------------------------------------------ compras

export interface PurchasesReport {
  rows: VehicleRow[];
  count: number;
  totalPurchase: number;
  avgCost: number | null; // custo total médio por veículo comprado
}

export function purchasesReport(period: Period): PurchasesReport {
  const from = periodStart(period);
  const rows = listVehicles("todos")
    .filter((v) => v.purchase_date && (!from || v.purchase_date >= from))
    .sort((a, b) => ((a.purchase_date ?? "") < (b.purchase_date ?? "") ? 1 : -1));
  const totalPurchase = rows.reduce((acc, r) => acc + (r.purchase_price ?? 0), 0);
  const totalCost = rows.reduce((acc, r) => acc + r.total_cost, 0);
  return {
    rows,
    count: rows.length,
    totalPurchase,
    avgCost: rows.length ? Math.round(totalCost / rows.length) : null,
  };
}

// ----------------------------------------------------------------- veículos

export interface VehicleRankings {
  topProfit: SaleReportRow[];
  topMargin: SaleReportRow[];
  longestInStock: VehicleRow[];
  highestCost: VehicleRow[];
}

export function vehicleRankings(): VehicleRankings {
  const sold = salesReport("tudo").rows;
  const stock = listVehicles("estoque");
  return {
    topProfit: [...sold].sort((a, b) => (b.profit ?? -Infinity) - (a.profit ?? -Infinity)).slice(0, 5),
    topMargin: [...sold].sort((a, b) => (b.margin ?? -Infinity) - (a.margin ?? -Infinity)).slice(0, 5),
    longestInStock: [...stock]
      .sort((a, b) => (vehicleMetrics(b).days ?? 0) - (vehicleMetrics(a).days ?? 0))
      .slice(0, 5),
    highestCost: [...listVehicles("todos")].sort((a, b) => b.total_cost - a.total_cost).slice(0, 5),
  };
}
