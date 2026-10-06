import { all } from "../db";
import type { EventRow } from "../types";

const BASE = `
SELECT e.*,
  TRIM(v.brand || ' ' || v.model || ' ' || COALESCE(v.version, '')) AS vehicle_label,
  cu.name AS customer_name
FROM events e
LEFT JOIN vehicles v   ON v.id = e.vehicle_id
LEFT JOIN customers cu ON cu.id = e.customer_id
`;

export async function recentEvents(limit = 10): Promise<EventRow[]> {
  return all<EventRow>(`${BASE} ORDER BY e.date DESC, e.id DESC LIMIT ${Math.max(1, Math.min(50, limit))}`);
}

export async function eventsForVehicle(vehicleId: number): Promise<EventRow[]> {
  return all<EventRow>(`${BASE} WHERE e.vehicle_id = ? ORDER BY e.date DESC, e.id DESC`, vehicleId);
}

export async function eventsForCustomer(customerId: number): Promise<EventRow[]> {
  return all<EventRow>(`${BASE} WHERE e.customer_id = ? ORDER BY e.date DESC, e.id DESC`, customerId);
}
