import { all } from "../db";
import type { DocRow, DocumentType } from "../types";

const BASE = `
SELECT doc.*,
  TRIM(v.brand || ' ' || v.model || ' ' || COALESCE(v.version, '')) AS vehicle_label,
  cu.name AS customer_name
FROM documents doc
LEFT JOIN vehicles v   ON v.id = doc.vehicle_id
LEFT JOIN customers cu ON cu.id = doc.customer_id
`;

export function listDocuments(type?: DocumentType | "todos"): DocRow[] {
  const where = type && type !== "todos" ? `WHERE doc.type = '${type.replace(/[^a-z_]/g, "")}'` : "";
  return all<DocRow>(`${BASE} ${where} ORDER BY doc.created_at DESC, doc.id DESC`);
}

export function documentCounts(): Record<string, number> {
  const rows = all<{ type: string; n: number }>("SELECT type, COUNT(*) AS n FROM documents GROUP BY type");
  const counts: Record<string, number> = { todos: 0 };
  for (const r of rows) {
    counts[r.type] = r.n;
    counts.todos += r.n;
  }
  return counts;
}

export function docsForVehicle(vehicleId: number): DocRow[] {
  return all<DocRow>(`${BASE} WHERE doc.vehicle_id = ? ORDER BY doc.created_at DESC`, vehicleId);
}

export function docsForCustomer(customerId: number): DocRow[] {
  return all<DocRow>(`${BASE} WHERE doc.customer_id = ? ORDER BY doc.created_at DESC`, customerId);
}
