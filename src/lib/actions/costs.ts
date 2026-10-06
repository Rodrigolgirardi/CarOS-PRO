"use server";

import { revalidatePath } from "next/cache";
import { get, run, tx } from "../db";
import { brl, todayISO } from "../format";
import { COST_CATEGORY } from "../labels";
import type { ActionState, Cost } from "../types";
import { err, fields, logEvent, ok } from "./util";

export async function addCost(vehicleId: number, prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const category = f.s("category");
  const amount = f.cents("amount");
  const date = f.s("date") ?? todayISO();
  if (!category || !(category in COST_CATEGORY)) return err("Escolha a categoria do custo.");
  if (amount == null || amount <= 0) return err("Informe o valor do custo.");

  const description = f.s("description");
  await run(
    "INSERT INTO costs (vehicle_id, category, description, amount, date) VALUES (?,?,?,?,?)",
    vehicleId,
    category,
    description,
    amount,
    date
  );
  await logEvent({
    type: "custo",
    description: `Custo adicionado — ${COST_CATEGORY[category as keyof typeof COST_CATEGORY]}${description ? `: ${description}` : ""}`,
    vehicle: vehicleId,
    amount,
    date,
  });
  revalidatePath("/", "layout");
  return ok("Custo adicionado.");
}

/** Variante do addCost em que o veículo vem do próprio formulário (lançamento rápido). */
export async function addCostForVehicle(prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);

  // Gasto administrativo (padaria, água, loja…): vira conta paga no caixa,
  // sem entrar no custo/lucro de nenhum veículo.
  if (f.s("vehicle_id") === "admin") {
    const amount = f.cents("amount");
    const date = f.s("date") ?? todayISO();
    const description = f.s("description");
    if (!description) return err("Descreva o gasto (ex.: padaria, água, material da loja).");
    if (amount == null || amount <= 0) return err("Informe o valor do gasto.");
    await run(
      "INSERT INTO payables (description, category, amount, due_date, status, paid_date) VALUES (?,?,?,?,'pago',?)",
      `Administrativo — ${description}`,
      "Gastos administrativos",
      amount,
      date,
      date
    );
    await logEvent({ type: "custo", description: `Gasto administrativo — ${description}`, amount, date });
    revalidatePath("/", "layout");
    return ok("Gasto administrativo lançado.");
  }

  const vehicleId = f.int("vehicle_id");
  if (vehicleId == null) return err("Escolha o veículo.");
  const vehicle = await get<{ id: number }>("SELECT id FROM vehicles WHERE id = ?", vehicleId);
  if (!vehicle) return err("Veículo não encontrado.");
  return addCost(vehicleId, prev, formData);
}

export async function updateCost(costId: number, prev: ActionState, formData: FormData): Promise<ActionState> {
  const cost = await get<Cost>("SELECT * FROM costs WHERE id = ?", costId);
  if (!cost) return err("Custo não encontrado.");

  const f = fields(formData);
  const category = f.s("category");
  const amount = f.cents("amount");
  const date = f.s("date") ?? cost.date;
  if (!category || !(category in COST_CATEGORY)) return err("Escolha a categoria do custo.");
  if (amount == null || amount <= 0) return err("Informe o valor do custo.");
  const description = f.s("description");

  await tx(async () => {
    await run(
      "UPDATE costs SET category = ?, description = ?, amount = ?, date = ? WHERE id = ?",
      category,
      description,
      amount,
      date,
      costId
    );
    // mantém em sincronia a tarefa/comissão que geraram este custo
    await run("UPDATE tasks SET cost = ? WHERE cost_id = ?", amount, costId);
    await run("UPDATE deals SET commission = ? WHERE commission_cost_id = ?", amount, costId);
    if (amount !== cost.amount || category !== cost.category) {
      await logEvent({
        type: "custo",
        description: `Custo atualizado — ${COST_CATEGORY[category as keyof typeof COST_CATEGORY]}${description ? `: ${description}` : ""}${
          amount !== cost.amount ? ` (${brl(cost.amount)} → ${brl(amount)})` : ""
        }`,
        vehicle: cost.vehicle_id,
        amount,
        date,
      });
    }
  });
  revalidatePath("/", "layout");
  return ok("Custo atualizado.");
}

export async function deleteCost(costId: number): Promise<{ ok: boolean; error?: string }> {
  const cost = await get<Cost>("SELECT * FROM costs WHERE id = ?", costId);
  if (!cost) return err("Custo não encontrado.");
  await run("UPDATE tasks SET cost_id = NULL WHERE cost_id = ?", costId);
  await run("UPDATE deals SET commission_cost_id = NULL WHERE commission_cost_id = ?", costId);
  await run("DELETE FROM costs WHERE id = ?", costId);
  await logEvent({
    type: "custo",
    description: `Custo removido — ${COST_CATEGORY[cost.category]} (${brl(cost.amount)})`,
    vehicle: cost.vehicle_id,
  });
  revalidatePath("/", "layout");
  return ok();
}
