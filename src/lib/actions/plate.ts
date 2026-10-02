"use server";

import { getMeta, setMeta } from "../db";
import { fetchPlate, normalizePlate, type PlateLookupResult } from "../plate-lookup";
import type { ActionState } from "../types";
import { err, fields, ok } from "./util";

const TOKEN_KEY = "plate_api_token";

/** Consulta a placa no provedor configurado e devolve os dados para o formulário. */
export async function lookupPlate(input: string): Promise<PlateLookupResult> {
  const plate = normalizePlate(input ?? "");
  if (!plate) return { ok: false, error: "Digite uma placa válida (ABC1234 ou ABC1D23)." };

  const token = getMeta(TOKEN_KEY) ?? process.env.PLACA_API_TOKEN ?? null;
  if (!token) {
    return { ok: false, needsToken: true, error: "Configure o token do serviço de consulta." };
  }
  return fetchPlate(plate, token);
}

export async function savePlateApiToken(prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = fields(formData).s("token");
  if (!token) return err("Cole o token do provedor.");
  setMeta(TOKEN_KEY, token);
  return ok("Token salvo neste computador.");
}
