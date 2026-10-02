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

export function recentEvents(limit = 10): EventRow[] {
  return all<EventRow>(`${BASE} ORDER BY e.date DESC, e.id DESC LIMIT ${Math.max(1, Math.min(50, limit))}`);
}

export function eventsForVehicle(vehicleId: number): EventRow[] {
  return all<EventRow>(`${BASE} WHERE e.vehicle_id = ? ORDER BY e.date DESC, e.id DESC`, vehicleId);
}

export function eventsForCustomer(customerId: number): EventRow[] {
  return all<EventRow>(`${BASE} WHERE e.customer_id = ? ORDER BY e.date DESC, e.id DESC`, customerId);
}
