"use server";

import { revalidatePath } from "next/cache";
import { get, run } from "../db";
import type { ActionState } from "../types";
import { err, fields, ok } from "./util";

/** "Lavagem especial" → "lavagem_especial" (único na tabela). */
function slugify(label: string): string {
  const base =
    label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "tipo";
  let key = base;
  for (let i = 2; get<{ key: string }>("SELECT key FROM commission_rules WHERE key = ?", key); i++) {
    key = `${base}_${i}`;
  }
  return key;
}

/** Cria um novo tipo de comissão (aparece na venda rápida e nas entradas). */
export async function createCommissionRule(prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const label = f.s("label");
  if (!label) return err("Dê um nome ao tipo de comissão.");
  const amount = f.cents("amount");
  if (amount != null && amount < 0) return err("Valor inválido.");
  const maxSort = get<{ m: number }>("SELECT COALESCE(MAX(sort), 0) AS m FROM commission_rules")!.m;
  run("INSERT INTO commission_rules (key, label, amount, sort) VALUES (?,?,?,?)", slugify(label), label, amount, maxSort + 1);
  revalidatePath("/", "layout");
  return ok("Tipo de comissão criado.");
}

/** Remove um tipo de comissão ("Venda de carro" fica, é o padrão da venda rápida). */
export async function deleteCommissionRule(key: string): Promise<{ ok: boolean; error?: string }> {
  if (key === "venda_carro") return err("“Venda de carro” é usada pela venda rápida e não pode ser removida.");
  const rule = get<{ key: string }>("SELECT key FROM commission_rules WHERE key = ?", key);
  if (!rule) return err("Tipo de comissão não encontrado.");
  run("DELETE FROM commission_rules WHERE key = ?", key);
  revalidatePath("/", "layout");
  return ok();
}

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
