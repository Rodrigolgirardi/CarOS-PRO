import { all, get } from "../db";
import type { Cost, VehicleRow, VehicleStatus } from "../types";

const BASE = `
SELECT
  v.*,
  p.id             AS purchase_id,
  p.price          AS purchase_price,
  COALESCE(p.date, v.consignado_date) AS purchase_date,
  p.seller         AS purchase_seller,
  p.payment_method AS purchase_payment,
  p.notes          AS purchase_notes,
  COALESCE(c.total, 0) AS costs_total,
  COALESCE(pl.n, 0) AS platforms_count,
  pl.names         AS platforms_list,
  COALESCE(p.price, 0) + COALESCE(c.total, 0) AS total_cost,
  sd.sale_price    AS sold_price,
  sd.sold_date     AS sold_date,
  sd.customer_id   AS buyer_id,
  bc.name          AS buyer_name
FROM vehicles v
LEFT JOIN purchases p ON p.vehicle_id = v.id
LEFT JOIN (SELECT vehicle_id, SUM(amount) AS total FROM costs GROUP BY vehicle_id) c ON c.vehicle_id = v.id
LEFT JOIN (SELECT vehicle_id, COUNT(*) AS n, STRING_AGG(platform, '|') AS names FROM vehicle_platforms GROUP BY vehicle_id) pl ON pl.vehicle_id = v.id
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
export async function listVehicles(filter: VehicleFilter = "todos"): Promise<VehicleRow[]> {
  let where = "";
  if (filter === "estoque") where = "WHERE v.status != 'vendido'";
  // a aba Cadastrados inclui os "para arrumar": continuam sendo estoque da loja
  else if (filter === "cadastrado") where = "WHERE v.status IN ('cadastrado', 'para_arrumar')";
  else if (filter === "consignados") where = "WHERE v.consignado = 1 AND v.status != 'vendido'";
  else if (filter === "parados")
    where =
      "WHERE v.status != 'vendido' AND COALESCE(p.date, v.consignado_date) IS NOT NULL AND (CURRENT_DATE - COALESCE(p.date, v.consignado_date)::date) > 60";
  else if (STATUS_FILTERS.includes(filter as VehicleStatus)) where = `WHERE v.status = '${filter}'`;
  return all<VehicleRow>(
    `${BASE} ${where}
     ORDER BY CASE WHEN v.status = 'vendido' THEN 1 ELSE 0 END, COALESCE(p.date, v.consignado_date, v.created_at) DESC, v.id DESC`
  );
}

export async function vehicleCounts(): Promise<Record<string, number>> {
  const rows = await all<{ status: string; n: number }>("SELECT status, COUNT(*) AS n FROM vehicles GROUP BY status");
  const counts: Record<string, number> = { todos: 0 };
  for (const r of rows) {
    counts[r.status] = r.n;
    counts.todos += r.n;
  }
  return counts;
}

export async function getVehicle(id: number): Promise<VehicleRow | undefined> {
  return get<VehicleRow>(`${BASE} WHERE v.id = ?`, id);
}

export async function vehicleCosts(vehicleId: number): Promise<Cost[]> {
  return all<Cost>("SELECT * FROM costs WHERE vehicle_id = ? ORDER BY date DESC, id DESC", vehicleId);
}

/** Plataformas onde o veículo já foi anunciado. */
export async function vehiclePlatforms(vehicleId: number): Promise<string[]> {
  return (await all<{ platform: string }>("SELECT platform FROM vehicle_platforms WHERE vehicle_id = ?", vehicleId)).map(
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

export async function vehicleOptions(opts?: { includeSold?: boolean; consignedOnly?: boolean }): Promise<VehicleOption[]> {
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
