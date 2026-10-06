import { all } from "../db";
import { TASK_TYPE } from "../labels";
import type { Task, TaskGroup, TaskRow } from "../types";

const BASE = `
SELECT t.*,
  TRIM(v.brand || ' ' || v.model || ' ' || COALESCE(v.version, '')) AS vehicle_label,
  v.photo  AS vehicle_photo,
  v.status AS vehicle_status
FROM tasks t
JOIN vehicles v ON v.id = t.vehicle_id
`;

export async function tasksForVehicle(vehicleId: number): Promise<Task[]> {
  return all<Task>("SELECT * FROM tasks WHERE vehicle_id = ? ORDER BY id", vehicleId);
}

export type TaskFilter = "pendentes" | "concluidas" | "todas";

export async function listTasks(filter: TaskFilter = "pendentes"): Promise<TaskRow[]> {
  const where =
    filter === "pendentes"
      ? "WHERE t.status = 'pendente'"
      : filter === "concluidas"
        ? "WHERE t.status = 'concluida'"
        : "";
  return all<TaskRow>(
    `${BASE} ${where}
     ORDER BY t.status = 'concluida', t.due_date IS NULL, t.due_date, v.id, t.id`
  );
}

export interface GroupSummary {
  group: TaskGroup;
  tasks: number;
  vehicles: number;
}

/** Resumo de pendências por grupo (Preparação, Documentação…). */
export async function pendingByGroup(): Promise<GroupSummary[]> {
  const rows = await all<{ type: string; vehicle_id: number }>(
    "SELECT type, vehicle_id FROM tasks WHERE status = 'pendente'"
  );
  const map = new Map<TaskGroup, { tasks: number; vehicles: Set<number> }>();
  for (const r of rows) {
    const group = TASK_TYPE[r.type as keyof typeof TASK_TYPE]?.group ?? "outros";
    const entry = map.get(group) ?? { tasks: 0, vehicles: new Set<number>() };
    entry.tasks += 1;
    entry.vehicles.add(r.vehicle_id);
    map.set(group, entry);
  }
  return [...map.entries()].map(([group, v]) => ({ group, tasks: v.tasks, vehicles: v.vehicles.size }));
}
