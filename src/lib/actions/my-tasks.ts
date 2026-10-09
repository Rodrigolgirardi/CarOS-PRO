"use server";

import { revalidatePath } from "next/cache";
import { get, run } from "../db";
import type { ActionState } from "../types";
import { err, fields, ok } from "./util";

const PRIORITIES = ["urgente", "importante", "afazer"];
const revalidate = () => revalidatePath("/tarefas");

/** Cria (id null) ou edita uma tarefa do quadro Minhas tarefas. */
export async function saveMyTask(id: number | null, prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const title = f.s("title");
  const priority = f.s("priority") ?? "afazer";
  if (!title) return err("Escreva a tarefa.");
  if (!PRIORITIES.includes(priority)) return err("Escolha a prioridade.");

  if (id == null) {
    await run("INSERT INTO my_tasks (title, notes, priority) VALUES (?,?,?)", title, f.s("notes"), priority);
    revalidate();
    return ok("Tarefa criada.");
  }
  await run("UPDATE my_tasks SET title = ?, notes = ?, priority = ? WHERE id = ?", title, f.s("notes"), priority, id);
  revalidate();
  return ok("Tarefa atualizada.");
}

/** Check: vai para Feitos (com a data); desmarcar volta para A fazer. */
export async function toggleMyTask(id: number): Promise<{ ok: boolean; error?: string; message?: string }> {
  const t = await get<{ done: number }>("SELECT done FROM my_tasks WHERE id = ?", id);
  if (!t) return err("Tarefa não encontrada.");
  if (t.done) {
    await run("UPDATE my_tasks SET done = 0, done_at = NULL WHERE id = ?", id);
  } else {
    await run(
      "UPDATE my_tasks SET done = 1, done_at = to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI:SS') WHERE id = ?",
      id
    );
  }
  revalidate();
  return ok(t.done ? "Tarefa voltou para A fazer." : "Feito! ✓");
}

export async function deleteMyTask(id: number): Promise<{ ok: boolean; error?: string; message?: string }> {
  await run("DELETE FROM my_tasks WHERE id = ?", id);
  revalidate();
  return ok("Tarefa excluída.");
}
