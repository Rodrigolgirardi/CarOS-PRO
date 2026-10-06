"use server";

import { revalidatePath } from "next/cache";
import { get, getMeta, run, setMeta } from "../db";
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

/**
 * Marca uma opção FIPE como a versão correta do veículo: ela vai para o topo,
 * vira a versão salva da placa e passa a preencher o formulário de compra.
 */
export async function choosePlateFipe(plate: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const row = get<{ data: string; model: string | null }>(
    "SELECT data, model FROM plate_lookups WHERE plate = ?",
    plate
  );
  if (!row) return err("Placa não encontrada no banco.");

  let data: import("../plate-lookup").PlateData;
  try {
    data = JSON.parse(row.data);
  } catch {
    return err("Dados desta placa estão corrompidos — remova e consulte de novo.");
  }
  const chosen = data.fipe.find((f) => f.code === code);
  if (!chosen) return err("Versão FIPE não encontrada nesta placa.");

  // "Gol 1.6 MSI Flex 16V 5p Aut." com modelo "Gol" → versão "1.6 MSI Flex 16V 5p Aut."
  let version = chosen.model.trim();
  const model = (data.model ?? row.model ?? "").trim();
  if (model && version.toUpperCase().startsWith(model.toUpperCase())) {
    version = version.slice(model.length).trim() || version;
  }

  data.chosenFipe = code;
  data.version = version;
  data.fipe = [chosen, ...data.fipe.filter((f) => f.code !== code)];

  run("UPDATE plate_lookups SET data = ?, version = ? WHERE plate = ?", JSON.stringify(data), version, plate);
  revalidatePath("/", "layout");
  return ok();
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
