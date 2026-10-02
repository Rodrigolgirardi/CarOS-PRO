import { all, get } from "../db";
import { COST_CATEGORY } from "../labels";
import type { CostCategory, PayableRow, ReceivableRow } from "../types";

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
}

export interface Cashflow {
  balance: number; // saldo acumulado (todo o histórico)
  inflow: number; // entradas no período
  outflow: number; // saídas no período
  entries: CashEntry[]; // extrato do período (desc)
}

/** Fluxo de caixa: entradas = recebimentos; saídas = compras + custos + contas pagas. */
export function cashflow(fromISO: string | null): Cashflow {
  const received = all<{ date: string; description: string; amount: number; vehicle_id: number | null }>(
    `SELECT re.received_date AS date, re.description, re.amount, d.vehicle_id
     FROM receivables re LEFT JOIN deals d ON d.id = re.deal_id
     WHERE re.status = 'recebido'`
  );
  const purchases = all<{ date: string; amount: number; vehicle_id: number; label: string }>(
    `SELECT p.date, p.price AS amount, p.vehicle_id,
       TRIM(v.brand || ' ' || v.model || ' ' || COALESCE(v.version, '')) AS label
     FROM purchases p JOIN vehicles v ON v.id = p.vehicle_id`
  );
  const costs = all<{ date: string; amount: number; vehicle_id: number; category: string; label: string }>(
    `SELECT c.date, c.amount, c.vehicle_id, c.category,
       TRIM(v.brand || ' ' || v.model || ' ' || COALESCE(v.version, '')) AS label
     FROM costs c JOIN vehicles v ON v.id = c.vehicle_id`
  );
  const paid = all<{ date: string; description: string; amount: number; vehicle_id: number | null }>(
    `SELECT paid_date AS date, description, amount, vehicle_id FROM payables WHERE status = 'pago' AND paid_date IS NOT NULL`
  );

  const entries: CashEntry[] = [
    ...received.map((r) => ({
      date: r.date,
      description: r.description,
      kind: "recebimento" as const,
      inflow: r.amount,
      outflow: 0,
      href: r.vehicle_id ? `/veiculos/${r.vehicle_id}` : null,
    })),
    ...purchases.map((p) => ({
      date: p.date,
      description: `Compra — ${p.label}`,
      kind: "compra" as const,
      inflow: 0,
      outflow: p.amount,
      href: `/veiculos/${p.vehicle_id}`,
    })),
    ...costs.map((c) => ({
      date: c.date,
      description: `${COST_CATEGORY[c.category as CostCategory] ?? "Custo"} — ${c.label}`,
      kind: "custo" as const,
      inflow: 0,
      outflow: c.amount,
      href: `/veiculos/${c.vehicle_id}`,
    })),
    ...paid.map((p) => ({
      date: p.date,
      description: p.description,
      kind: "conta" as const,
      inflow: 0,
      outflow: p.amount,
      href: p.vehicle_id ? `/veiculos/${p.vehicle_id}` : null,
    })),
  ];

  const balance = entries.reduce((acc, e) => acc + e.inflow - e.outflow, 0);
  const inPeriod = fromISO ? entries.filter((e) => e.date >= fromISO) : entries;
  inPeriod.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return {
    balance,
    inflow: inPeriod.reduce((acc, e) => acc + e.inflow, 0),
    outflow: inPeriod.reduce((acc, e) => acc + e.outflow, 0),
    entries: inPeriod,
  };
}
