"use server";

import { revalidatePath } from "next/cache";
import { get, run } from "../db";
import type { ActionState, Seller } from "../types";
import { err, fields, ok } from "./util";

const revalidate = () => revalidatePath("/", "layout");

/** "1,5" ou "1.5" → 1.5; vazio → null. */
function parsePct(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw.replace("%", "").replace(",", ".").trim());
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n;
}

/** Lê o par tipo + valor do formulário: % vira commission_pct, R$ vira commission_fixed. */
function parseCommission(f: ReturnType<typeof fields>): { pct: number | null; fixed: number | null } {
  if (f.s("commission_type") === "fixed") return { pct: null, fixed: f.cents("commission_fixed") };
  return { pct: parsePct(f.s("commission_pct")), fixed: null };
}

export async function createSeller(prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const name = f.s("name");
  if (!name) return err("Informe o nome do vendedor.");
  const { pct, fixed } = parseCommission(f);
  run("INSERT INTO sellers (name, commission_pct, commission_fixed) VALUES (?, ?, ?)", name, pct, fixed);
  revalidate();
  return ok("Vendedor cadastrado.");
}

export async function updateSeller(id: number, prev: ActionState, formData: FormData): Promise<ActionState> {
  const seller = get<Seller>("SELECT * FROM sellers WHERE id = ?", id);
  if (!seller) return err("Vendedor não encontrado.");
  const f = fields(formData);
  const name = f.s("name");
  if (!name) return err("Informe o nome do vendedor.");
  const { pct, fixed } = parseCommission(f);
  run("UPDATE sellers SET name = ?, commission_pct = ?, commission_fixed = ? WHERE id = ?", name, pct, fixed, id);
  revalidate();
  return ok("Vendedor atualizado.");
}

export async function deleteSeller(id: number): Promise<{ ok: boolean; error?: string }> {
  const seller = get<Seller>("SELECT * FROM sellers WHERE id = ?", id);
  if (!seller) return err("Vendedor não encontrado.");
  run("UPDATE deals SET seller_id = NULL WHERE seller_id = ?", id);
  run("DELETE FROM sellers WHERE id = ?", id);
  revalidate();
  return ok();
}
