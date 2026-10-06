import { all, get } from "../db";
import type { Cost, VehicleRow, VehicleStatus } from "../types";

const BASE = `
SELECT
  v.*,
  p.id             AS purchase_id,
  p.price          AS purchase_price,
  p.date           AS purchase_date,
  p.seller         AS purchase_seller,
  p.payment_method AS purchase_payment,
  p.notes          AS purchase_notes,
  COALESCE(c.total, 0) AS costs_total,
  COALESCE(p.price, 0) + COALESCE(c.total, 0) AS total_cost,
  sd.sale_price    AS sold_price,
  sd.sold_date     AS sold_date,
  sd.customer_id   AS buyer_id,
  bc.name          AS buyer_name
FROM vehicles v
LEFT JOIN purchases p ON p.vehicle_id = v.id
LEFT JOIN (SELECT vehicle_id, SUM(amount) AS total FROM costs GROUP BY vehicle_id) c ON c.vehicle_id = v.id
LEFT JOIN deals sd ON sd.vehicle_id = v.id AND sd.stage IN ('vendido', 'entregue')
LEFT JOIN customers bc ON bc.id = sd.customer_id
`;

export type VehicleFilter =
  | "todos"
  | "para_cadastrar"
  | "para_arrumar"
  | "cadastrado"
  | "vendido"
  | "estoque"
  | "parados"
  | "consignados"; // carros de terceiros ainda na loja

const STATUS_FILTERS: VehicleStatus[] = ["para_cadastrar", "para_arrumar", "cadastrado", "vendido"];

// Consignados ficam junto do estoque em todas as listas; a aba Consignados é só um recorte.
export function listVehicles(filter: VehicleFilter = "todos"): VehicleRow[] {
  let where = "";
  if (filter === "estoque") where = "WHERE v.status != 'vendido'";
  else if (filter === "consignados") where = "WHERE v.consignado = 1 AND v.status != 'vendido'";
  else if (filter === "parados")
    where =
      "WHERE v.status != 'vendido' AND p.date IS NOT NULL AND julianday('now', 'localtime') - julianday(p.date) > 60";
  else if (STATUS_FILTERS.includes(filter as VehicleStatus)) where = `WHERE v.status = '${filter}'`;
  return all<VehicleRow>(
    `${BASE} ${where}
     ORDER BY CASE WHEN v.status = 'vendido' THEN 1 ELSE 0 END, COALESCE(p.date, v.created_at) DESC, v.id DESC`
  );
}

export function vehicleCounts(): Record<string, number> {
  const rows = all<{ status: string; n: number }>("SELECT status, COUNT(*) AS n FROM vehicles GROUP BY status");
  const counts: Record<string, number> = { todos: 0 };
  for (const r of rows) {
    counts[r.status] = r.n;
    counts.todos += r.n;
  }
  return counts;
}

export function getVehicle(id: number): VehicleRow | undefined {
  return get<VehicleRow>(`${BASE} WHERE v.id = ?`, id);
}

export function vehicleCosts(vehicleId: number): Cost[] {
  return all<Cost>("SELECT * FROM costs WHERE vehicle_id = ? ORDER BY date DESC, id DESC", vehicleId);
}

/** Plataformas onde o veículo já foi anunciado. */
export function vehiclePlatforms(vehicleId: number): string[] {
  return all<{ platform: string }>("SELECT platform FROM vehicle_platforms WHERE vehicle_id = ?", vehicleId).map(
    (r) => r.platform
  );
}

/** Opções para selects (negociações, tarefas, documentos…). */
export interface VehicleOption {
  id: number;
  label: string;
  plate: string | null;
  status: VehicleStatus;
  sale_price: number | null;
}

export function vehicleOptions(opts?: { includeSold?: boolean; consignedOnly?: boolean }): VehicleOption[] {
  const conds = [
    ...(opts?.includeSold ? [] : ["status != 'vendido'"]),
    ...(opts?.consignedOnly ? ["consignado = 1"] : []),
  ];
  const where = conds.length > 0 ? `WHERE ${conds.join(" AND ")}` : "";
  return all<VehicleOption>(
    `SELECT id, TRIM(brand || ' ' || model || ' ' || COALESCE(version, '')) AS label, plate, status, sale_price
     FROM vehicles ${where} ORDER BY brand, model`
  );
}
