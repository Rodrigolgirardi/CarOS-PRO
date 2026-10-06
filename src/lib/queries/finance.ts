import { all, get } from "../db";
import { COST_CATEGORY } from "../labels";
import { vehicleLabel, vehicleMetrics } from "../metrics";
import type { CostCategory, PayableRow, ReceivableRow, VehicleStatus } from "../types";
import { listVehicles } from "./vehicles";

export type FinanceStatusFilter = "pendentes" | "resolvidas" | "todas";

export function listPayables(filter: FinanceStatusFilter = "pendentes"): PayableRow[] {
  const where =
    filter === "pendentes" ? "WHERE pa.status = 'pendente'" : filter === "resolvidas" ? "WHERE pa.status = 'pago'" : "";
  return all<PayableRow>(
    `SELECT pa.*, TRIM(v.brand || ' ' || v.model || ' ' || COALESCE(v.version, '')) AS vehicle_label
     FROM payables pa
     LEFT JOIN vehicles v ON v.id = pa.vehicle_id
     ${where}
     ORDER BY pa.status = 'pago', pa.due_date, pa.id`
  );
}

export function listReceivables(filter: FinanceStatusFilter = "pendentes"): ReceivableRow[] {
  const where =
    filter === "pendentes"
      ? "WHERE re.status = 'pendente'"
      : filter === "resolvidas"
        ? "WHERE re.status = 'recebido'"
        : "";
  return all<ReceivableRow>(
    `SELECT re.*, cu.name AS customer_name,
       TRIM(v.brand || ' ' || v.model || ' ' || COALESCE(v.version, '')) AS vehicle_label
     FROM receivables re
     LEFT JOIN customers cu ON cu.id = re.customer_id
     LEFT JOIN deals d ON d.id = re.deal_id
     LEFT JOIN vehicles v ON v.id = d.vehicle_id
     ${where}
     ORDER BY re.status = 'recebido', re.due_date, re.id`
  );
}

/** DRE por veículo: compra − custos por categoria + venda = lucro/prejuízo. */
export interface DreCostLine {
  category: CostCategory;
  label: string;
  total: number;
}

export interface DreVehicle {
  id: number;
  label: string;
  plate: string | null;
  status: VehicleStatus;
  sold: boolean;
  purchase: number;
  costs: DreCostLine[];
  costsTotal: number;
  sale: number | null; // vendido → valor real; em estoque → preço anunciado
  profit: number | null;
}

export function dreData(): DreVehicle[] {
  const grouped = all<{ vehicle_id: number; category: CostCategory; total: number }>(
    "SELECT vehicle_id, category, SUM(amount) AS total FROM costs GROUP BY vehicle_id, category"
  );
  const costsByVehicle = new Map<number, DreCostLine[]>();
  for (const g of grouped) {
    const list = costsByVehicle.get(g.vehicle_id) ?? [];
    list.push({ category: g.category, label: COST_CATEGORY[g.category] ?? g.category, total: g.total });
    costsByVehicle.set(g.vehicle_id, list);
  }

  return listVehicles("todos").map((v) => {
    const m = vehicleMetrics(v);
    const costs = (costsByVehicle.get(v.id) ?? []).sort((a, b) => b.total - a.total);
    // consignado ainda não vendido: o repasse combinado entra como custo previsto
    const pendingRepasse = v.consignado === 1 && !m.sold && v.consignor_value != null ? v.consignor_value : 0;
    if (pendingRepasse > 0) {
      costs.push({ category: "outros", label: "Repasse ao dono (combinado)", total: pendingRepasse });
    }
    return {
      id: v.id,
      label: vehicleLabel(v),
      plate: v.plate,
      status: v.status,
      sold: m.sold,
      purchase: v.purchase_price ?? 0,
      costs,
      costsTotal: v.costs_total + pendingRepasse,
      sale: m.priceRef,
      profit: m.profit, // métricas já descontam o repasse pendente do consignado
    };
  });
}

export function openTotals(): { payables: number; payablesCount: number; receivables: number; receivablesCount: number } {
  const p = get<{ total: number; n: number }>(
    "SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS n FROM payables WHERE status = 'pendente'"
  )!;
  const r = get<{ total: number; n: number }>(
    "SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS n FROM receivables WHERE status = 'pendente'"
  )!;
  return { payables: p.total, payablesCount: p.n, receivables: r.total, receivablesCount: r.n };
}

export interface CashEntry {
  date: string;
  description: string;
  kind: "recebimento" | "compra" | "custo" | "conta";
  inflow: number;
  outflow: number;
  href: string | null;
  vehicle_label: string | null; // carro ligado ao lançamento (coluna Carro | Placa)
  vehicle_plate: string | null;
}

export interface CashMonth {
  key: string; // "2026-10"
  label: string; // "out" (com /ano na virada)
  inflow: number;
  outflow: number;
}

export interface Cashflow {
  balance: number; // saldo acumulado (todo o histórico)
  inflow: number; // entradas no período
  outflow: number; // saídas no período
  entries: CashEntry[]; // extrato do período (desc)
  monthly: CashMonth[]; // últimos 12 meses, do mais antigo ao atual
}

/** Fluxo de caixa: entradas = recebimentos; saídas = compras + custos + contas pagas. */
export function cashflow(fromISO: string | null, toISO?: string | null): Cashflow {
  const VLABEL = "TRIM(v.brand || ' ' || v.model || ' ' || COALESCE(v.version, ''))";
  const received = all<{
    date: string;
    description: string;
    amount: number;
    vehicle_id: number | null;
    label: string | null;
    plate: string | null;
  }>(
    `SELECT re.received_date AS date, re.description, re.amount, d.vehicle_id, ${VLABEL} AS label, v.plate
     FROM receivables re
     LEFT JOIN deals d ON d.id = re.deal_id
     LEFT JOIN vehicles v ON v.id = d.vehicle_id
     WHERE re.status = 'recebido'`
  );
  const purchases = all<{ date: string; amount: number; vehicle_id: number; label: string; plate: string | null }>(
    `SELECT p.date, p.price AS amount, p.vehicle_id, ${VLABEL} AS label, v.plate
     FROM purchases p JOIN vehicles v ON v.id = p.vehicle_id`
  );
  const costs = all<{
    date: string;
    amount: number;
    vehicle_id: number;
    category: string;
    description: string | null;
    label: string;
    plate: string | null;
  }>(
    `SELECT c.date, c.amount, c.vehicle_id, c.category, c.description, ${VLABEL} AS label, v.plate
     FROM costs c JOIN vehicles v ON v.id = c.vehicle_id`
  );
  const paid = all<{
    date: string;
    description: string;
    amount: number;
    vehicle_id: number | null;
    label: string | null;
    plate: string | null;
  }>(
    `SELECT pa.paid_date AS date, pa.description, pa.amount, pa.vehicle_id, ${VLABEL} AS label, v.plate
     FROM payables pa LEFT JOIN vehicles v ON v.id = pa.vehicle_id
     WHERE pa.status = 'pago' AND pa.paid_date IS NOT NULL`
  );

  const entries: CashEntry[] = [
    ...received.map((r) => ({
      date: r.date,
      description: r.description,
      kind: "recebimento" as const,
      inflow: r.amount,
      outflow: 0,
      href: r.vehicle_id ? `/veiculos/${r.vehicle_id}` : null,
      vehicle_label: r.label,
      vehicle_plate: r.plate,
    })),
    ...purchases.map((p) => ({
      date: p.date,
      description: "Compra do veículo",
      kind: "compra" as const,
      inflow: 0,
      outflow: p.amount,
      href: `/veiculos/${p.vehicle_id}`,
      vehicle_label: p.label,
      vehicle_plate: p.plate,
    })),
    ...costs.map((c) => ({
      date: c.date,
      description: `${COST_CATEGORY[c.category as CostCategory] ?? "Custo"}${c.description ? ` — ${c.description}` : ""}`,
      kind: "custo" as const,
      inflow: 0,
      outflow: c.amount,
      href: `/veiculos/${c.vehicle_id}`,
      vehicle_label: c.label,
      vehicle_plate: c.plate,
    })),
    ...paid.map((p) => ({
      date: p.date,
      description: p.description,
      kind: "conta" as const,
      inflow: 0,
      outflow: p.amount,
      href: p.vehicle_id ? `/veiculos/${p.vehicle_id}` : null,
      vehicle_label: p.label,
      vehicle_plate: p.plate,
    })),
  ];

  const balance = entries.reduce((acc, e) => acc + e.inflow - e.outflow, 0);
  const inPeriod = entries.filter(
    (e) => (!fromISO || e.date >= fromISO) && (!toISO || e.date <= toISO)
  );
  inPeriod.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  // série mensal (independe do filtro de período)
  const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const now = new Date();
  const monthly: CashMonth[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const showYear = i === 11 || d.getMonth() === 0;
    monthly.push({
      key,
      label: `${MONTHS_PT[d.getMonth()]}${showYear ? `/${String(d.getFullYear()).slice(2)}` : ""}`,
      inflow: 0,
      outflow: 0,
    });
  }
  const byMonth = new Map(monthly.map((m) => [m.key, m]));
  for (const e of entries) {
    const bucket = byMonth.get(e.date.slice(0, 7));
    if (!bucket) continue;
    bucket.inflow += e.inflow;
    bucket.outflow += e.outflow;
  }

  return {
    balance,
    inflow: inPeriod.reduce((acc, e) => acc + e.inflow, 0),
    outflow: inPeriod.reduce((acc, e) => acc + e.outflow, 0),
    entries: inPeriod,
    monthly,
  };
}
