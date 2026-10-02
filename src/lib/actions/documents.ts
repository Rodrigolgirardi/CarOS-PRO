"use server";

import { revalidatePath } from "next/cache";
import { get, run } from "../db";
import { DOC_TYPE } from "../labels";
import { deleteUpload, saveUpload } from "../uploads";
import type { ActionState, Doc } from "../types";
import { err, fields, logEvent, ok } from "./util";

export async function uploadDocument(prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const file = f.file("file");
  if (!file) return err("Escolha um arquivo.");
  if (file.size > 20 * 1024 * 1024) return err("Arquivo muito grande (máximo 20 MB).");
  const type = f.s("type") ?? "outro";
  if (!(type in DOC_TYPE)) return err("Tipo de documento inválido.");

  const saved = await saveUpload(file);
  const name = f.s("name") ?? file.name;
  const vehicleId = f.id("vehicle_id");
  const customerId = f.id("customer_id");
  const dealId = f.id("deal_id");

  run(
    "INSERT INTO documents (name, type, vehicle_id, customer_id, deal_id, file_name, mime, size) VALUES (?,?,?,?,?,?,?,?)",
    name,
    type,
    vehicleId,
    customerId,
    dealId,
    saved.fileName,
    saved.mime,
    saved.size
  );
  logEvent({
    type: "documento",
    description: `Documento anexado — ${name}`,
    vehicle: vehicleId,
    customer: customerId,
    deal: dealId,
  });
  revalidatePath("/", "layout");
  return ok("Documento anexado.");
}

export async function deleteDocument(id: number): Promise<{ ok: boolean; error?: string }> {
  const doc = get<Doc>("SELECT * FROM documents WHERE id = ?", id);
  if (!doc) return err("Documento não encontrado.");
  run("DELETE FROM documents WHERE id = ?", id);
  deleteUpload(doc.file_name);
  revalidatePath("/", "layout");
  return ok("Documento excluído.");
}
