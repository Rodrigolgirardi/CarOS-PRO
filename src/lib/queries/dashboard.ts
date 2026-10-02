import { get } from "../db";
import { monthStartISO } from "../format";
import { vehicleMetrics } from "../metrics";
import type { EventRow, VehicleRow } from "../types";
import { recentEvents } from "./events";
import { listVehicles } from "./vehicles";

export interface DashboardData {
  stock: {
    count: number;
    preparing: number;
    invested: number;
    saleValue: number; // soma dos preços de venda definidos
    pricedCount: number;
    potentialProfit: number;
    avgDays: number | null;
  };
  month: {
    sales: number;
    revenue: number;
    profit: number;
    margin: number | null;
  };
  attention: {
    stale: number; // parados há mais de 60 dias
    docsPendingVehicles: number; // veículos com documentação/transferência pendente
    preparing: number;
    payablesOpen: number;
    payablesOverdue: number;
    receivablesPending: number; // vendas aguardando recebimento (qtde)
    receivablesPendingTotal: number;
  };
  recent: EventRow[];
}

export function dashboardData(): DashboardData {
  const stockRows = listVehicles("estoque");
  const soldRows = listVehicles("vendido");
  const monthStart = monthStartISO();

  let invested = 0;
  let saleValue = 0;
  let pricedCount = 0;
  let potentialProfit = 0;
  let daysSum = 0;
  let daysCount = 0;
  let stale = 0;
  for (const v of stockRows) {
    const m = vehicleMetrics(v);
    invested += v.total_cost;
    if (v.sale_price != null) {
      saleValue += v.sale_price;
      pricedCount += 1;
      if (m.profit != null) potentialProfit += m.profit;
    }
    if (m.days != null) {
      daysSum += m.days;
      daysCount += 1;
      if (m.days > 60) stale += 1;
    }
  }

  const monthSold = soldRows.filter((v) => v.sold_date && v.sold_date >= monthStart);
  let revenue = 0;
  let profit = 0;
  for (const v of monthSold) {
    const m = vehicleMetrics(v);
    if (m.priceRef != null) revenue += m.priceRef;
    if (m.profit != null) profit += m.profit;
  }

  const docsPending = get<{ n: number }>(
    `SELECT COUNT(DISTINCT vehicle_id) AS n FROM tasks
     WHERE status = 'pendente' AND type IN ('documentacao', 'transferencia')`
  )!;
  const payables = get<{ total: number; overdue: number }>(
    `SELECT COALESCE(SUM(amount), 0) AS total,
            COALESCE(SUM(CASE WHEN due_date < date('now', 'localtime') THEN 1 ELSE 0 END), 0) AS overdue
     FROM payables WHERE status = 'pendente'`
  )!;
  const receivables = get<{ n: number; total: number }>(
    `SELECT COUNT(*) AS n, COALESCE(SUM(amount), 0) AS total
     FROM receivables WHERE status = 'pendente' AND deal_id IS NOT NULL`
  )!;

  return {
    stock: {
      count: stockRows.length,
      preparing: stockRows.filter((v) => v.status === "preparacao").length,
      invested,
      saleValue,
      pricedCount,
      potentialProfit,
      avgDays: daysCount > 0 ? Math.round(daysSum / daysCount) : null,
    },
    month: {
      sales: monthSold.length,
      revenue,
      profit,
      margin: revenue > 0 ? profit / revenue : null,
    },
    attention: {
      stale,
      docsPendingVehicles: docsPending.n,
      preparing: stockRows.filter((v) => v.status === "preparacao").length,
      payablesOpen: payables.total,
      payablesOverdue: payables.overdue,
      receivablesPending: receivables.n,
      receivablesPendingTotal: receivables.total,
    },
    recent: recentEvents(9),
  };
}

export type { VehicleRow };
