import { all, get } from "../db";
import type { DealRow } from "../types";

const BASE = `
SELECT
  d.*,
  cu.name AS customer_name,
  TRIM(v.brand || ' ' || v.model || ' ' || COALESCE(v.version, '')) AS vehicle_label,
  v.status     AS vehicle_status,
  v.photo      AS vehicle_photo,
  v.plate      AS vehicle_plate,
  v.sale_price AS vehicle_sale_price,
  COALESCE(p.price, 0) + COALESCE(c.total, 0) AS vehicle_total_cost,
  p.date AS purchase_date,
  COALESCE(r.received, 0) AS received,
  COALESCE(r.pending, 0)  AS pending
FROM deals d
JOIN customers cu ON cu.id = d.customer_id
JOIN vehicles v   ON v.id = d.vehicle_id
LEFT JOIN purchases p ON p.vehicle_id = v.id
LEFT JOIN (SELECT vehicle_id, SUM(amount) AS total FROM costs GROUP BY vehicle_id) c ON c.vehicle_id = v.id
LEFT JOIN (
  SELECT deal_id,
         SUM(CASE WHEN status = 'recebido' THEN amount ELSE 0 END) AS received,
         SUM(CASE WHEN status = 'pendente' THEN amount ELSE 0 END) AS pending
  FROM receivables GROUP BY deal_id
) r ON r.deal_id = d.id
`;

export async function listDeals(): Promise<DealRow[]> {
  return all<DealRow>(`${BASE} ORDER BY d.created_at DESC, d.id DESC`);
}

export async function getDeal(id: number): Promise<DealRow | undefined> {
  return get<DealRow>(`${BASE} WHERE d.id = ?`, id);
}

export async function dealsForVehicle(vehicleId: number): Promise<DealRow[]> {
  return all<DealRow>(`${BASE} WHERE d.vehicle_id = ? ORDER BY d.created_at DESC`, vehicleId);
}

export async function dealsForCustomer(customerId: number): Promise<DealRow[]> {
  return all<DealRow>(`${BASE} WHERE d.customer_id = ? ORDER BY d.created_at DESC`, customerId);
}
