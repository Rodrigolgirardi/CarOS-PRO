import { all, get, run } from "../db";
import type { PlateData } from "../plate-lookup";

/**
 * Cache local das consultas de placa. Cada busca paga na API é salva aqui;
 * repetir a placa devolve o resultado salvo, sem custo.
 */

export interface PlateCacheRow {
  plate: string;
  data: string; // PlateData em JSON
  brand: string | null;
  model: string | null;
  version: string | null;
  year_fab: number | null;
  year_model: number | null;
  color: string | null;
  fuel: string | null;
  created_at: string;
}

export function listPlateCache(): PlateCacheRow[] {
  return all<PlateCacheRow>("SELECT * FROM plate_lookups ORDER BY created_at DESC, plate");
}

export function getPlateCache(plate: string): PlateData | null {
  const row = get<{ data: string }>("SELECT data FROM plate_lookups WHERE plate = ?", plate);
  if (!row) return null;
  try {
    return JSON.parse(row.data) as PlateData;
  } catch {
    return null; // JSON corrompido: trata como não cacheado (a busca re-salva)
  }
}

export function savePlateCache(plate: string, data: PlateData): void {
  run(
    `INSERT OR REPLACE INTO plate_lookups (plate, data, brand, model, version, year_fab, year_model, color, fuel, created_at)
     VALUES (?,?,?,?,?,?,?,?,?, datetime('now'))`,
    plate,
    JSON.stringify(data),
    data.brand,
    data.model,
    data.version,
    data.year_fab,
    data.year_model,
    data.color,
    data.fuel
  );
}
