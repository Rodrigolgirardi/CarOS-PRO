import { all, get } from "../db";
import type { Customer, CustomerStatus } from "../types";

export interface CustomerListRow extends Customer {
  purchases_count: number;
  active_interest: string | null;
  last_activity: string | null;
}

export async function listCustomers(status?: CustomerStatus | "todos"): Promise<CustomerListRow[]> {
  const where = status && status !== "todos" ? `WHERE cu.status = '${status.replace(/[^a-z]/g, "")}'` : "";
  return all<CustomerListRow>(
    `SELECT cu.*,
       (SELECT COUNT(*) FROM deals d WHERE d.customer_id = cu.id AND d.stage IN ('vendido', 'entregue')) AS purchases_count,
       (SELECT TRIM(v.brand || ' ' || v.model || ' ' || COALESCE(v.version, ''))
          FROM deals d JOIN vehicles v ON v.id = d.vehicle_id
         WHERE d.customer_id = cu.id AND d.stage IN ('interessado', 'proposta', 'reservado')
         ORDER BY d.created_at DESC LIMIT 1) AS active_interest,
       (SELECT MAX(date) FROM events e WHERE e.customer_id = cu.id) AS last_activity
     FROM customers cu
     ${where}
     ORDER BY cu.created_at DESC, cu.id DESC`
  );
}

export async function customerCounts(): Promise<Record<string, number>> {
  const rows = await all<{ status: string; n: number }>("SELECT status, COUNT(*) AS n FROM customers GROUP BY status");
  const counts: Record<string, number> = { todos: 0 };
  for (const r of rows) {
    counts[r.status] = r.n;
    counts.todos += r.n;
  }
  return counts;
}

export async function getCustomer(id: number): Promise<Customer | undefined> {
  return get<Customer>("SELECT * FROM customers WHERE id = ?", id);
}

export interface CustomerOption {
  id: number;
  name: string;
  city: string | null;
}

export async function customerOptions(): Promise<CustomerOption[]> {
  return all<CustomerOption>("SELECT id, name, city FROM customers ORDER BY name");
}
