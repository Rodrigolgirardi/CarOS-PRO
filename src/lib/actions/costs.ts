"use server";

import { revalidatePath } from "next/cache";
import { get, run, tx } from "../db";
import { brl, todayISO } from "../format";
import { ADMIN_EXPENSE_TYPES, COST_CATEGORY, costLabel } from "../labels";
import type { ActionState, Cost } from "../types";
import { err, fields, logEvent, ok } from "./util";

/** Categoria fixa (Frete, Peças…) ou criada em Configurações → Entradas e saídas. */
async function validCategory(category: string | null): Promise<boolean> {
  if (!category) return false;
  if (category in COST_CATEGORY) return true;
  return !!(await get<{ id: number }>("SELECT id FROM custom_types WHERE kind = 'saida' AND label = ?", category));
}

export async function addCost(vehicleId: number, prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const category = f.s("category");
  const amount = f.cents("amount");
  const date = f.s("date") ?? todayISO();
  if (!(await validCategory(category))) return err("Escolha a categoria do custo.");
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
    description: `Custo adicionado — ${costLabel(category!)}${description ? `: ${description}` : ""}`,
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

  // Gasto administrativo (pró-labore, água, luz…): vira conta paga no caixa,
  // sem entrar no custo/lucro de nenhum carro. "Qual o gasto?" é obrigatório.
  if (f.s("vehicle_id") === "admin") {
    const kind = f.s("admin_type");
    const known =
      !!kind && (ADMIN_EXPENSE_TYPES.includes(kind) || (await validCategory(kind)));
    if (!known) return err("Escolha qual é o gasto (pró-labore, água, luz…).");
    const amount = f.cents("amount");
    const date = f.s("date") ?? todayISO();
    if (amount == null || amount <= 0) return err("Informe o valor do gasto.");
    const label = costLabel(kind!);
    const detail = f.s("description");
    const description = detail ? `${label} — ${detail}` : label;
    await run(
      "INSERT INTO payables (description, category, amount, due_date, status, paid_date) VALUES (?,?,?,?,'pago',?)",
      description,
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
  if (!(await validCategory(category))) return err("Escolha a categoria do custo.");
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
        description: `Custo atualizado — ${costLabel(category!)}${description ? `: ${description}` : ""}${
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
    description: `Custo removido — ${costLabel(cost.category)} (${brl(cost.amount)})`,
    vehicle: cost.vehicle_id,
  });
  revalidatePath("/", "layout");
  return ok();
}
