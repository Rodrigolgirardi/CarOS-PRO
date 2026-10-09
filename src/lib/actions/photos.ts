"use server";

import { revalidatePath } from "next/cache";
import { get, run } from "../db";
import { deleteUpload, saveUpload } from "../uploads";
import type { ActionState } from "../types";
import { err, ok } from "./util";

interface PhotoRow {
  id: number;
  vehicle_id: number;
  file_name: string;
}

/** Adiciona uma ou várias fotos à galeria do veículo (input name="photos"). */
export async function addVehiclePhotos(vehicleId: number, prev: ActionState, formData: FormData): Promise<ActionState> {
  const vehicle = await get<{ id: number; photo: string | null }>(
    "SELECT id, photo FROM vehicles WHERE id = ?",
    vehicleId
  );
  if (!vehicle) return err("Veículo não encontrado.");

  const files = formData.getAll("photos").filter((v): v is File => v instanceof File && v.size > 0);
  if (files.length === 0) return err("Escolha pelo menos uma foto.");
  for (const file of files) {
    if (file.size > 20 * 1024 * 1024) return err("Foto muito grande (máximo 20 MB por foto).");
  }

  // continua a ordenação de onde parou
  const last = await get<{ max: number | null }>(
    "SELECT MAX(sort) AS max FROM vehicle_photos WHERE vehicle_id = ?",
    vehicleId
  );
  let sort = (last?.max ?? 0) + 1;

  let cover = vehicle.photo;
  for (const file of files) {
    const saved = await saveUpload(file);
    await run("INSERT INTO vehicle_photos (vehicle_id, file_name, sort) VALUES (?,?,?)", vehicleId, saved.fileName, sort++);
    // veículo ainda sem foto de capa: a primeira enviada assume o posto
    if (!cover) {
      cover = saved.fileName;
      await run("UPDATE vehicles SET photo = ? WHERE id = ?", cover, vehicleId);
    }
  }

  revalidatePath("/", "layout");
  return ok(files.length === 1 ? "Foto adicionada." : `${files.length} fotos adicionadas.`);
}

/** Exclui a foto; se era a capa, promove a próxima da galeria (ou limpa). */
export async function deleteVehiclePhoto(id: number): Promise<{ ok: boolean; error?: string; message?: string }> {
  const photo = await get<PhotoRow>("SELECT * FROM vehicle_photos WHERE id = ?", id);
  if (!photo) return err("Foto não encontrada.");

  await run("DELETE FROM vehicle_photos WHERE id = ?", id);
  deleteUpload(photo.file_name);

  const vehicle = await get<{ photo: string | null }>("SELECT photo FROM vehicles WHERE id = ?", photo.vehicle_id);
  if (vehicle && vehicle.photo === photo.file_name) {
    const next = await get<{ file_name: string }>(
      "SELECT file_name FROM vehicle_photos WHERE vehicle_id = ? ORDER BY sort, id LIMIT 1",
      photo.vehicle_id
    );
    await run("UPDATE vehicles SET photo = ? WHERE id = ?", next?.file_name ?? null, photo.vehicle_id);
  }

  revalidatePath("/", "layout");
  return ok("Foto excluída.");
}

/** Define a foto como capa do veículo (aparece nas listas e no topo da ficha). */
export async function setCoverPhoto(id: number): Promise<{ ok: boolean; error?: string; message?: string }> {
  const photo = await get<PhotoRow>("SELECT * FROM vehicle_photos WHERE id = ?", id);
  if (!photo) return err("Foto não encontrada.");

  await run("UPDATE vehicles SET photo = ? WHERE id = ?", photo.file_name, photo.vehicle_id);
  revalidatePath("/", "layout");
  return ok("Foto de capa definida.");
}
