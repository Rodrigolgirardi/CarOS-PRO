import Link from "next/link";
import { CalendarClock, Wrench } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { TaskCheck } from "@/components/tasks/task-check";
import { TaskCreateButton, TaskEditButton } from "@/components/tasks/task-dialogs";
import { EmptyState } from "@/components/ui/empty-state";
import { Chips } from "@/components/ui/tabs";
import { VehiclePhoto } from "@/components/vehicles/vehicle-photo";
import { brl, daysUntil, fmtDate } from "@/lib/format";
import { TASK_GROUP, TASK_TYPE } from "@/lib/labels";
import { listTasks, pendingByGroup, type TaskFilter } from "@/lib/queries/tasks";
import { vehicleOptions } from "@/lib/queries/vehicles";
import type { TaskGroup } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Operações" };

const GROUP_ORDER: TaskGroup[] = ["preparacao", "manutencao", "documentacao", "fotos", "anuncio", "outros"];

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ grupo?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const grupo = GROUP_ORDER.includes(sp.grupo as TaskGroup) ? (sp.grupo as TaskGroup) : null;
  const statusFilter: TaskFilter = ["pendentes", "concluidas", "todas"].includes(sp.status ?? "")
    ? (sp.status as TaskFilter)
    : "pendentes";

  const tasks = await listTasks(statusFilter);
  const summary = await pendingByGroup();
  const vehicles = await vehicleOptions({ includeSold: true });

  const summaryFor = (g: TaskGroup) => summary.find((s) => s.group === g);
  const visibleGroups = (grupo ? [grupo] : GROUP_ORDER).filter((g) =>
    tasks.some((t) => TASK_TYPE[t.type].group === g)
  );

  const qs = (g: TaskGroup | null, s: TaskFilter) => {
    const params = new URLSearchParams();
    if (g) params.set("grupo", g);
    if (s !== "pendentes") params.set("status", s);
    const str = params.toString();
    return `/operacoes${str ? `?${str}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Operações"
        description="Tudo que precisa ser feito nos veículos — o checklist da ficha mora aqui."
        actions={<TaskCreateButton vehicles={vehicles} />}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Chips
          activeKey={grupo ?? "todos"}
          items={[
            { key: "todos", label: "Todos", href: qs(null, statusFilter) },
            ...GROUP_ORDER.map((g) => ({
              key: g,
              label: TASK_GROUP[g],
              count: summaryFor(g)?.tasks ?? 0,
              href: qs(g, statusFilter),
            })),
          ]}
        />
        <Chips
          activeKey={statusFilter}
          items={[
            { key: "pendentes", label: "Pendentes", href: qs(grupo, "pendentes") },
            { key: "concluidas", label: "Concluídas", href: qs(grupo, "concluidas") },
            { key: "todas", label: "Todas", href: qs(grupo, "todas") },
          ]}
        />
      </div>

      {visibleGroups.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Nada por aqui"
          description={
            statusFilter === "pendentes"
              ? "Nenhuma tarefa pendente — estoque em dia."
              : "Nenhuma tarefa neste filtro."
          }
        />
      ) : (
        <div className="space-y-6">
          {visibleGroups.map((g) => {
            const groupTasks = tasks.filter((t) => TASK_TYPE[t.type].group === g);
            const s = summaryFor(g);
            return (
              <section key={g}>
                <div className="mb-2 flex items-baseline justify-between px-0.5">
                  <h2 className="text-[13px] font-semibold text-zinc-900">{TASK_GROUP[g]}</h2>
                  {s && (
                    <span className="text-xs text-zinc-400">
                      {s.tasks} {s.tasks === 1 ? "tarefa pendente" : "tarefas pendentes"} ·{" "}
                      {s.vehicles} {s.vehicles === 1 ? "veículo" : "veículos"}
                    </span>
                  )}
                </div>
                <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
                  {groupTasks.map((t) => {
                    const done = t.status === "concluida";
                    const overdue = !done && t.due_date != null && daysUntil(t.due_date) < 0;
                    return (
                      <div key={t.id} className="group flex items-center gap-3 px-4 py-2.5">
                        <TaskCheck id={t.id} done={done} label={TASK_TYPE[t.type].label} />
                        <Link href={`/veiculos/${t.vehicle_id}?tab=operacoes`} className="flex min-w-0 items-center gap-2.5">
                          <VehiclePhoto photo={t.vehicle_photo} brand={t.vehicle_label} size="xs" />
                          <span className="max-w-[200px] truncate text-[13px] font-medium text-zinc-800 underline-offset-2 hover:underline">
                            {t.vehicle_label}
                          </span>
                        </Link>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-[13px] ${done ? "text-zinc-400 line-through" : "text-zinc-600"}`}>
                            {TASK_TYPE[t.type].label}
                            {t.description && <span className="text-zinc-400"> — {t.description}</span>}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-xs text-zinc-400">
                          {t.assignee && <span className="max-w-[140px] truncate">{t.assignee}</span>}
                          {t.due_date && !done && (
                            <span className={`inline-flex items-center gap-1 ${overdue ? "font-medium text-red-500" : ""}`}>
                              <CalendarClock size={11} />
                              {fmtDate(t.due_date)}
                            </span>
                          )}
                          {done && t.done_date && <span>✓ {fmtDate(t.done_date)}</span>}
                          {t.cost != null && <span className="tabular-nums">{brl(t.cost)}</span>}
                        </div>
                        <TaskEditButton task={t} />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
