"use server";

import { revalidatePath } from "next/cache";
import { getMeta, run, setMeta } from "../db";
import { fetchPlate, normalizePlate, type PlateLookupResult } from "../plate-lookup";
import { getPlateCache, savePlateCache } from "../queries/plate-cache";
import type { ActionState } from "../types";
import { err, fields, ok } from "./util";

const TOKEN_KEY = "plate_api_token";

/**
 * Consulta a placa: primeiro no banco de dados local (grátis);
 * só vai à API paga quando a placa nunca foi pesquisada.
 */
export async function lookupPlate(input: string): Promise<PlateLookupResult> {
  const plate = normalizePlate(input ?? "");
  if (!plate) return { ok: false, error: "Digite uma placa válida (ABC1234 ou ABC1D23)." };

  const cached = getPlateCache(plate);
  if (cached) return { ok: true, data: cached, cached: true };

  const token = getMeta(TOKEN_KEY) ?? process.env.PLACA_API_TOKEN ?? null;
  if (!token) {
    return { ok: false, needsToken: true, error: "Configure o token do serviço de consulta." };
  }
  const result = await fetchPlate(plate, token);
  if (result.ok) {
    savePlateCache(plate, result.data);
    revalidatePath("/banco-de-dados");
  }
  return result;
}

/** Remove uma placa do banco local — a próxima busca dela consulta a API de novo. */
export async function deletePlateCache(plate: string): Promise<{ ok: boolean; error?: string }> {
  run("DELETE FROM plate_lookups WHERE plate = ?", plate);
  revalidatePath("/", "layout");
  return ok();
}

export async function savePlateApiToken(prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = fields(formData).s("token");
  if (!token) return err("Cole o token do provedor.");
  setMeta(TOKEN_KEY, token);
  return ok("Token salvo neste computador.");
}
