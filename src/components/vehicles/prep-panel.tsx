import { TaskCreateButton } from "@/components/tasks/task-dialogs";
import { PrepCheck } from "@/components/vehicles/prep-check";
import { brl, daysUntil, fmtDateShort } from "@/lib/format";
import { DEFAULT_CHECKLIST, TASK_TYPE } from "@/lib/labels";
import { tasksForVehicle } from "@/lib/queries/tasks";
import type { Task } from "@/lib/types";

/** Painel "Preparação" — checklist de tarefas do veículo, pendentes primeiro. */
export async function PrepPanel({ vehicleId }: { vehicleId: number }) {
  const tasks = await tasksForVehicle(vehicleId);

  const checklistOrder = (t: Task) => {
    const i = DEFAULT_CHECKLIST.indexOf(t.type);
    return i === -1 ? 99 : i;
  };
  const sorted = [...tasks].sort(
    (a, b) =>
      Number(a.status === "concluida") - Number(b.status === "concluida") ||
      checklistOrder(a) - checklistOrder(b) ||
      a.id - b.id
  );
  const doneCount = tasks.filter((t) => t.status === "concluida").length;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Preparação</h2>
          {tasks.length > 0 && (
            <p className="mt-0.5 text-xs text-zinc-400">
              {doneCount} de {tasks.length} {doneCount === 1 ? "concluída" : "concluídas"}
            </p>
          )}
        </div>
        <TaskCreateButton vehicleId={vehicleId} />
      </header>

      {sorted.length === 0 ? (
        <p className="px-4 py-6 text-center text-[13px] text-zinc-500 sm:px-5">
          Nenhuma tarefa para este veículo ainda.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 px-1.5 py-1 sm:px-2.5">
          {sorted.map((t) => {
            const done = t.status === "concluida";
            const overdue = !done && t.due_date != null && daysUntil(t.due_date) < 0;
            return (
              <li key={t.id} className="flex items-center gap-1.5 py-0.5">
                <PrepCheck id={t.id} done={done} label={TASK_TYPE[t.type].label} />
                <div className="min-w-0 flex-1 py-2">
                  <p
                    className={`truncate text-[13px] font-medium ${done ? "text-zinc-400 line-through" : "text-zinc-800"}`}
                  >
                    {TASK_TYPE[t.type].label}
                    {t.description && (
                      <span className={done ? "" : "font-normal text-zinc-500"}> — {t.description}</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2.5 pr-2 text-xs text-zinc-400">
                  {t.due_date && !done && (
                    <span className={overdue ? "font-medium text-red-500" : ""}>{fmtDateShort(t.due_date)}</span>
                  )}
                  {t.cost != null && t.cost > 0 && <span className="tabular-nums">{brl(t.cost)}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
