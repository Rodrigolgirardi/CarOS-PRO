import { all } from "../db";

export type MyTaskPriority = "urgente" | "importante" | "afazer";

export interface MyTask {
  id: number;
  title: string;
  notes: string | null;
  priority: MyTaskPriority;
  done: number;
  done_at: string | null;
  created_at: string;
}

/** A fazer: urgente → importante → a fazer, mais antigas primeiro. Feitos: o mais recente primeiro. */
export async function listMyTasks(): Promise<{ todo: MyTask[]; done: MyTask[] }> {
  const rows = await all<MyTask>(
    `SELECT * FROM my_tasks
      ORDER BY done,
               CASE WHEN done = 1 THEN 0 ELSE CASE priority WHEN 'urgente' THEN 0 WHEN 'importante' THEN 1 ELSE 2 END END,
               CASE WHEN done = 1 THEN done_at END DESC,
               id`
  );
  return { todo: rows.filter((t) => !t.done), done: rows.filter((t) => t.done) };
}
