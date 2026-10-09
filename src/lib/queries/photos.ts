import { all } from "../db";

export interface VehiclePhoto {
  id: number;
  vehicle_id: number;
  file_name: string;
  sort: number;
  created_at: string;
}

/** Fotos da galeria de um veículo, na ordem definida pelo lojista. */
export async function listVehiclePhotos(vehicleId: number): Promise<VehiclePhoto[]> {
  return all<VehiclePhoto>(
    "SELECT * FROM vehicle_photos WHERE vehicle_id = ? ORDER BY sort, id",
    vehicleId
  );
}
