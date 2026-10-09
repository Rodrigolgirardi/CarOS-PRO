"use server";

import { revalidatePath } from "next/cache";
import { get, run } from "../db";
import { COST_CATEGORY, INCOME_TYPES } from "../labels";
import type { ActionState } from "../types";
import { err, fields, ok } from "./util";

const revalidate = () => revalidatePath("/", "layout");

/** Cria um tipo de saída ou de entrada (aparece nos formulários de Adicionar saída / entrada). */
export async function addCustomType(kind: "saida" | "entrada", prev: ActionState, formData: FormData): Promise<ActionState> {
  const label = fields(formData).s("label");
  if (!label) return err("Escreva o nome do tipo.");
  if (label.length > 40) return err("Nome muito longo (máximo 40 letras).");

  const lower = label.toLowerCase();
  const builtIn =
    kind === "saida"
      ? Object.values(COST_CATEGORY).some((l) => l.toLowerCase() === lower)
      : INCOME_TYPES.some((t) => t.label.toLowerCase() === lower);
  const exists = await get<{ id: number }>(
    "SELECT id FROM custom_types WHERE kind = ? AND lower(label) = lower(?)",
    kind,
    label
  );
  if (builtIn || exists) return err("Esse tipo já existe.");

  await run("INSERT INTO custom_types (kind, label) VALUES (?, ?)", kind, label);
  revalidate();
  return ok(kind === "saida" ? "Tipo de saída criado." : "Tipo de entrada criado.");
}

/** Remove o tipo da lista (lançamentos antigos continuam com o nome gravado). */
export async function deleteCustomType(id: number): Promise<{ ok: boolean; error?: string; message?: string }> {
  await run("DELETE FROM custom_types WHERE id = ?", id);
  revalidate();
  return ok("Tipo removido.");
}

export async function addFeedback(prev: ActionState, formData: FormData): Promise<ActionState> {
  const message = fields(formData).s("message");
  if (!message) return err("Escreva o seu feedback ou sugestão.");
  await run("INSERT INTO feedback (message) VALUES (?)", message);
  revalidate();
  return ok("Obrigado! Feedback registrado.");
}

export async function deleteFeedback(id: number): Promise<{ ok: boolean; error?: string; message?: string }> {
  await run("DELETE FROM feedback WHERE id = ?", id);
  revalidate();
  return ok("Feedback removido.");
}
