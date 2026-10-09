"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import { deleteMyTask, saveMyTask, toggleMyTask } from "@/lib/actions/my-tasks";
import type { MyTask, MyTaskPriority } from "@/lib/queries/my-tasks";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm";
import { Field, Input, Textarea } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { PRIORITY } from "./priority";


const fmtWhen = (iso: string) => {
  const [d, t] = iso.split(" ");
  return `${d!.slice(8, 10)}/${d!.slice(5, 7)}${t ? `, ${t.slice(0, 5)}` : ""}`;
};

/** Escolha da prioridade em 3 bolinhas clicáveis (vermelho, laranja, verde). */
function PriorityPicker({ value, onChange }: { value: MyTaskPriority; onChange: (p: MyTaskPriority) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(Object.keys(PRIORITY) as MyTaskPriority[]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border px-2 py-2 text-[13px] font-medium transition-colors",
            value === p ? PRIORITY[p].ring : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
          )}
        >
          <span className={cn("size-2.5 rounded-full", PRIORITY[p].dot)} />
          {PRIORITY[p].label}
        </button>
      ))}
    </div>
  );
}

function TaskModal({ task, open, onClose }: { task?: MyTask; open: boolean; onClose: () => void }) {
  const [priority, setPriority] = useState<MyTaskPriority>(task?.priority ?? "afazer");
  const { state, formAction } = useAction(saveMyTask.bind(null, task?.id ?? null), { onSuccess: onClose });
  return (
    <Modal open={open} onClose={onClose} title={task ? "Editar tarefa" : "Nova tarefa"}>
      <form action={formAction} className="space-y-4">
        <Field label="Missão" required>
          <Input name="title" defaultValue={task?.title ?? ""} placeholder="Ex.: Levar o Gol no despachante" required autoFocus />
        </Field>
        <Field label="Detalhes">
          <Textarea name="notes" defaultValue={task?.notes ?? ""} rows={3} placeholder="Opcional" />
        </Field>
        <Field label="Prioridade">
          <input type="hidden" name="priority" value={priority} />
          <PriorityPicker value={priority} onChange={setPriority} />
        </Field>
        <FormError state={state} />
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancelar</Button>
          <SubmitButton>{task ? "Salvar" : "Criar tarefa"}</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

export function NewTaskButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus size={14} />
        Nova tarefa
      </Button>
      {/* montado só quando abre: o formulário começa zerado a cada vez */}
      {open && <TaskModal open onClose={() => setOpen(false)} />}
    </>
  );
}

/** Card da tarefa: bolinha de prioridade, check (vai para Feitos), lápis e lixeira. */
export function TaskCard({ task }: { task: MyTask }) {
  const [editOpen, setEditOpen] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const done = task.done === 1;
  const meta = PRIORITY[task.priority] ?? PRIORITY.afazer;

  const toggle = () =>
    start(async () => {
      const r = await toggleMyTask(task.id);
      if (r.ok) toast(r.message ?? "Ok");
      else toast(r.error ?? "Não foi possível atualizar.", "error");
    });

  return (
    <article
      className={cn(
        "group rounded-xl border border-zinc-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-opacity",
        pending && "opacity-50"
      )}
    >
      <div className="flex items-start gap-3">
        {/* check: marcar como feito / desfazer */}
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-label={done ? "Voltar para A fazer" : "Marcar como feito"}
          title={done ? "Voltar para A fazer" : "Marcar como feito"}
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
            done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-zinc-300 text-transparent hover:border-emerald-500 hover:text-emerald-500"
          )}
        >
          <Check size={12} strokeWidth={3} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <span title={meta.label} className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", meta.dot, done && "opacity-40")} />
            <p className={cn("text-[13px] font-medium leading-snug", done ? "text-zinc-400 line-through" : "text-zinc-900")}>
              {task.title}
            </p>
          </div>
          {task.notes && (
            <p className={cn("mt-1 whitespace-pre-wrap text-xs leading-relaxed", done ? "text-zinc-400" : "text-zinc-500")}>
              {task.notes}
            </p>
          )}
          <p className="mt-2 text-[11px] tabular-nums text-zinc-400">
            {done && task.done_at ? `Feito em ${fmtWhen(task.done_at)}` : `Criado em ${fmtWhen(task.created_at)}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {done ? (
            <Button variant="ghost" size="sm" className="size-7 p-0" aria-label="Voltar para A fazer" onClick={toggle}>
              <Undo2 size={13} />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="size-7 p-0" aria-label="Editar tarefa" onClick={() => setEditOpen(true)}>
              <Pencil size={13} />
            </Button>
          )}
          <ConfirmButton
            action={deleteMyTask.bind(null, task.id)}
            title="Excluir esta tarefa?"
            description={task.title}
            variant="danger-ghost"
            className="size-7 p-0"
          >
            <Trash2 size={13} />
          </ConfirmButton>
        </div>
      </div>
      {editOpen && <TaskModal task={task} open onClose={() => setEditOpen(false)} />}
    </article>
  );
}
