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
  vehicle_id: number | null; // carro vinculado (opcional)
  vehicle_label: string | null;
  vehicle_brand: string | null;
  vehicle_plate: string | null;
}

/** A fazer: urgente → importante → a fazer, mais antigas primeiro. Feitos: o mais recente primeiro. */
export async function listMyTasks(): Promise<{ todo: MyTask[]; done: MyTask[] }> {
  const rows = await all<MyTask>(
    `SELECT t.*, TRIM(v.brand || ' ' || v.model || ' ' || COALESCE(v.version, '')) AS vehicle_label,
            v.brand AS vehicle_brand, v.plate AS vehicle_plate
       FROM my_tasks t
       LEFT JOIN vehicles v ON v.id = t.vehicle_id
      ORDER BY t.done,
               CASE WHEN t.done = 1 THEN 0 ELSE CASE t.priority WHEN 'urgente' THEN 0 WHEN 'importante' THEN 1 ELSE 2 END END,
               CASE WHEN t.done = 1 THEN t.done_at END DESC,
               t.id`
  );
  return { todo: rows.filter((t) => !t.done), done: rows.filter((t) => t.done) };
}
