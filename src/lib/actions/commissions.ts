"use server";

import { revalidatePath } from "next/cache";
import { get, run } from "../db";
import type { ActionState } from "../types";
import { err, fields, ok } from "./util";

/** Atualiza o valor padrão de uma comissão (vazio = em branco). */
export async function saveCommissionRule(key: string, prev: ActionState, formData: FormData): Promise<ActionState> {
  const rule = get<{ key: string }>("SELECT key FROM commission_rules WHERE key = ?", key);
  if (!rule) return err("Tipo de comissão não encontrado.");
  const amount = fields(formData).cents("amount"); // null quando em branco
  if (amount != null && amount < 0) return err("Valor inválido.");
  run("UPDATE commission_rules SET amount = ? WHERE key = ?", amount, key);
  revalidatePath("/", "layout");
  return ok("Comissão atualizada.");
}
