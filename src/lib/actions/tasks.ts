"use server";

import { revalidatePath } from "next/cache";
import { get, run, tx } from "../db";
import { todayISO } from "../format";
import { COST_CATEGORY, TASK_COST_CATEGORY, TASK_TYPE } from "../labels";
import type { ActionState, Task, TaskType } from "../types";
import { err, fields, logEvent, ok } from "./util";

const revalidate = () => revalidatePath("/", "layout");

function createLinkedCost(task: Task, amount: number): number {
  const category = TASK_COST_CATEGORY[task.type];
  const label = TASK_TYPE[task.type].label;
  const description = task.description ? `${label}: ${task.description}` : label;
  const r = run(
    "INSERT INTO costs (vehicle_id, category, description, amount, date) VALUES (?,?,?,?,?)",
    task.vehicle_id,
    category,
    description,
    amount,
    todayISO()
  );
  logEvent({
    type: "custo",
    description: `Custo adicionado — ${COST_CATEGORY[category]}: ${description}`,
    vehicle: task.vehicle_id,
    amount,
  });
  return r.lastId;
}

/** Marca/desmarca uma tarefa. Concluir com custo informado gera o custo no veículo. */
export async function toggleTask(taskId: number): Promise<{ ok: boolean; error?: string }> {
  const task = get<Task>("SELECT * FROM tasks WHERE id = ?", taskId);
  if (!task) return err("Tarefa não encontrada.");

  tx(() => {
    if (task.status === "pendente") {
      let costId = task.cost_id;
      if (task.cost && task.cost > 0 && !costId) costId = createLinkedCost(task, task.cost);
      run("UPDATE tasks SET status = 'concluida', done_date = ?, cost_id = ? WHERE id = ?", todayISO(), costId, taskId);
      logEvent({ type: "tarefa", description: `Tarefa concluída — ${TASK_TYPE[task.type].label}`, vehicle: task.vehicle_id });
    } else {
      if (task.cost_id) run("DELETE FROM costs WHERE id = ?", task.cost_id);
      run("UPDATE tasks SET status = 'pendente', done_date = NULL, cost_id = NULL WHERE id = ?", taskId);
    }
  });
  revalidate();
  return ok();
}

/** Cria (taskId = null) ou edita uma tarefa. */
export async function saveTask(taskId: number | null, prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const type = (f.s("type") ?? "outro") as TaskType;
  if (!(type in TASK_TYPE)) return err("Tipo de tarefa inválido.");
  const cost = f.cents("cost");

  if (taskId == null) {
    const vehicleId = f.id("vehicle_id");
    if (!vehicleId) return err("Escolha o veículo.");
    run(
      "INSERT INTO tasks (vehicle_id, type, description, assignee, due_date, cost) VALUES (?,?,?,?,?,?)",
      vehicleId,
      type,
      f.s("description"),
      f.s("assignee"),
      f.s("due_date"),
      cost
    );
    revalidate();
    return ok("Tarefa criada.");
  }

  const task = get<Task>("SELECT * FROM tasks WHERE id = ?", taskId);
  if (!task) return err("Tarefa não encontrada.");

  tx(() => {
    run(
      "UPDATE tasks SET type=?, description=?, assignee=?, due_date=?, cost=? WHERE id=?",
      type,
      f.s("description"),
      f.s("assignee"),
      f.s("due_date"),
      cost,
      taskId
    );
    // tarefa já concluída: manter o custo vinculado em sincronia
    if (task.status === "concluida") {
      const updated = { ...task, type, description: f.s("description"), cost } as Task;
      if (task.cost_id && cost && cost > 0) {
        run("UPDATE costs SET amount = ? WHERE id = ?", cost, task.cost_id);
      } else if (task.cost_id && (!cost || cost <= 0)) {
        run("DELETE FROM costs WHERE id = ?", task.cost_id);
        run("UPDATE tasks SET cost_id = NULL WHERE id = ?", taskId);
      } else if (!task.cost_id && cost && cost > 0) {
        const costId = createLinkedCost(updated, cost);
        run("UPDATE tasks SET cost_id = ? WHERE id = ?", costId, taskId);
      }
    }
  });
  revalidate();
  return ok("Tarefa atualizada.");
}

export async function deleteTask(taskId: number): Promise<{ ok: boolean; error?: string }> {
  const task = get<Task>("SELECT * FROM tasks WHERE id = ?", taskId);
  if (!task) return err("Tarefa não encontrada.");
  tx(() => {
    if (task.cost_id) run("DELETE FROM costs WHERE id = ?", task.cost_id);
    run("DELETE FROM tasks WHERE id = ?", taskId);
  });
  revalidate();
  return ok();
}
