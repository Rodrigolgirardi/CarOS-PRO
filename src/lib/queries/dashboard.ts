import { get } from "../db";
import { monthStartISO } from "../format";
import { vehicleMetrics } from "../metrics";
import type { EventRow, VehicleRow } from "../types";
import { recentEvents } from "./events";
import { cashflow } from "./finance";
import { listVehicles } from "./vehicles";

export interface StockVehicleSlice {
  id: number;
  label: string;
  invested: number; // compra + custos
  purchase: number; // só o preço de compra
  sale: number | null;
  profit: number | null; // null quando não há preço de venda
}

export interface MonthlyPoint {
  key: string; // "2026-10"
  label: string; // "out" (com /ano na virada)
  sales: number;
  revenue: number;
  profit: number; // lucro das vendas do mês (venda − custo dos carros vendidos)
  spend: number; // saídas do mês: compras + custos + contas pagas
}

export interface DashboardData {
  stock: {
    count: number;
    preparing: number;
    invested: number;
    saleValue: number; // soma dos preços de venda definidos
    pricedCount: number;
    potentialProfit: number;
    avgDays: number | null;
    vehicles: StockVehicleSlice[];
  };
  month: {
    sales: number;
    revenue: number;
    profit: number;
    margin: number | null;
    spend: number; // saídas do mês: compras + custos + contas pagas
  };
  monthly: MonthlyPoint[]; // últimos 12 meses, do mais antigo ao atual

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
  const slices: StockVehicleSlice[] = [];
  for (const v of stockRows) {
    const m = vehicleMetrics(v);
    invested += v.total_cost;
    slices.push({
      id: v.id,
      label: `${v.brand} ${v.model}`,
      invested: v.total_cost,
      purchase: v.purchase_price ?? 0,
      sale: v.sale_price,
      profit: v.sale_price != null ? (m.profit ?? v.sale_price - v.total_cost) : null,
    });
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

  // série mensal: últimos 12 meses, incluindo meses sem venda
  const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const now = new Date();
  const monthly: MonthlyPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const showYear = i === 11 || d.getMonth() === 0;
    monthly.push({
      key,
      label: `${MONTHS_PT[d.getMonth()]}${showYear ? `/${String(d.getFullYear()).slice(2)}` : ""}`,
      sales: 0,
      revenue: 0,
      profit: 0,
      spend: 0,
    });
  }
  const byMonth = new Map(monthly.map((m) => [m.key, m]));
  for (const v of soldRows) {
    const bucket = v.sold_date ? byMonth.get(v.sold_date.slice(0, 7)) : undefined;
    if (!bucket) continue;
    const m = vehicleMetrics(v);
    bucket.sales += 1;
    bucket.revenue += m.priceRef ?? 0;
    bucket.profit += m.profit ?? 0;
  }
  for (const cm of cashflow(null).monthly) {
    const bucket = byMonth.get(cm.key);
    if (bucket) bucket.spend = cm.outflow;
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
      vehicles: slices.sort((a, b) => b.invested - a.invested),
    },
    month: {
      sales: monthSold.length,
      revenue,
      profit,
      margin: revenue > 0 ? profit / revenue : null,
      spend: cashflow(monthStart).outflow,
    },
    monthly,
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
