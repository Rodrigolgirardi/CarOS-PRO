import { CheckCheck, ListTodo } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { NewTaskButton, TaskCard } from "@/components/my-tasks/my-tasks";
import { PRIORITY } from "@/components/my-tasks/priority";
import { listMyTasks, type MyTaskPriority } from "@/lib/queries/my-tasks";
import { vehicleOptions } from "@/lib/queries/vehicles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Minhas tarefas" };

function Column({
  title,
  icon: Icon,
  count,
  aside,
  empty,
  children,
}: {
  title: string;
  icon: typeof ListTodo;
  count: number;
  aside?: React.ReactNode;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-80 flex-col rounded-2xl border border-zinc-200 bg-zinc-50/70">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-zinc-900">
          <Icon size={15} className="text-zinc-400" />
          {title}
          <span className="rounded-full bg-zinc-200/70 px-1.5 py-px text-[11px] tabular-nums text-zinc-600">{count}</span>
        </h2>
        {aside}
      </div>
      <div className="flex-1 space-y-2 p-3">
        {count === 0 ? (
          <p className="grid h-full min-h-40 place-items-center text-center text-[13px] text-zinc-400">{empty}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

/** Minhas tarefas: quadro pessoal estilo kanban — A fazer (por prioridade) e Feitos. */
export default async function MyTasksPage() {
  const [{ todo, done }, vehicles] = await Promise.all([listMyTasks(), vehicleOptions({ includeSold: true })]);
  const byPriority = (p: MyTaskPriority) => todo.filter((t) => t.priority === p).length;

  return (
    <div className="lg:mx-auto lg:max-w-5xl">
      <PageHeader
        title="Minhas tarefas"
        description="Suas missões do dia a dia. Marque o check quando terminar — a tarefa vai para Feitos."
        actions={<NewTaskButton vehicles={vehicles} />}
      />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Column
          title="A fazer"
          icon={ListTodo}
          count={todo.length}
          empty="Nada pendente. Crie uma tarefa em “Nova tarefa”."
          aside={
            <span className="flex items-center gap-3 text-[11px] text-zinc-500">
              {(Object.keys(PRIORITY) as MyTaskPriority[]).map((p) => (
                <span key={p} className="flex items-center gap-1" title={PRIORITY[p].label}>
                  <span className={`size-2 rounded-full ${PRIORITY[p].dot}`} />
                  <span className="tabular-nums">{byPriority(p)}</span>
                </span>
              ))}
            </span>
          }
        >
          {todo.map((t) => (
            <TaskCard key={t.id} task={t} vehicles={vehicles} />
          ))}
        </Column>
        <Column title="Feitos" icon={CheckCheck} count={done.length} empty="As tarefas concluídas aparecem aqui.">
          {done.map((t) => (
            <TaskCard key={t.id} task={t} vehicles={vehicles} />
          ))}
        </Column>
      </div>
    </div>
  );
}
