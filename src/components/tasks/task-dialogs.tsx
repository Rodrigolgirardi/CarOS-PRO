"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteTask, saveTask } from "@/lib/actions/tasks";
import { TASK_TYPE } from "@/lib/labels";
import type { Task, TaskType } from "@/lib/types";
import type { VehicleOption } from "@/lib/queries/vehicles";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, Input, Select } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

function TaskFields({ task, vehicles, vehicleId }: { task?: Task; vehicles?: VehicleOption[]; vehicleId?: number }) {
  return (
    <>
      {vehicleId != null ? (
        <input type="hidden" name="vehicle_id" value={vehicleId} />
      ) : vehicles ? (
        <Field label="Veículo" required>
          <Select name="vehicle_id" defaultValue={task?.vehicle_id ?? ""} required>
            <option value="" disabled>
              Escolha…
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
                {v.plate ? ` · ${v.plate}` : ""}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tipo" required>
          <Select name="type" defaultValue={task?.type ?? "outro"} required>
            {(Object.keys(TASK_TYPE) as TaskType[]).map((t) => (
              <option key={t} value={t}>
                {TASK_TYPE[t].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Responsável">
          <Input name="assignee" defaultValue={task?.assignee ?? ""} placeholder="Oficina do Léo" />
        </Field>
      </div>
      <Field label="Descrição">
        <Input name="description" defaultValue={task?.description ?? ""} placeholder="Correia dentada + fluidos" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Prazo">
          <Input type="date" name="due_date" defaultValue={task?.due_date ?? ""} />
        </Field>
        <Field label="Custo" hint="Ao concluir, vira custo do veículo.">
          <CurrencyInput name="cost" defaultCents={task?.cost} />
        </Field>
      </div>
    </>
  );
}

export function TaskCreateButton({ vehicleId, vehicles }: { vehicleId?: number; vehicles?: VehicleOption[] }) {
  const [open, setOpen] = useState(false);
  const { state, formAction } = useAction(saveTask.bind(null, null), { onSuccess: () => setOpen(false) });

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Plus size={13} />
        Nova tarefa
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova tarefa">
        <form action={formAction} className="space-y-4">
          <TaskFields vehicleId={vehicleId} vehicles={vehicles} />
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton>Criar tarefa</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function TaskEditButton({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const { state, formAction } = useAction(saveTask.bind(null, task.id), { onSuccess: () => setOpen(false) });

  const remove = () =>
    startTransition(async () => {
      const r = await deleteTask(task.id);
      if (r.ok) setOpen(false);
      else toast(r.error ?? "Não foi possível excluir.", "error");
    });

  return (
    <>
      <button
        type="button"
        aria-label="Editar tarefa"
        onClick={() => setOpen(true)}
        className="grid size-6 place-items-center rounded-md text-zinc-300 opacity-0 transition-all hover:bg-zinc-100 hover:text-zinc-600 focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Pencil size={12} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Editar tarefa">
        <form action={formAction} className="space-y-4">
          <TaskFields task={task} vehicleId={task.vehicle_id} />
          <FormError state={state} />
          <div className="flex items-center justify-between gap-2">
            <Button variant="danger" size="sm" onClick={remove} disabled={pending}>
              {pending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Excluir
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => setOpen(false)}>Cancelar</Button>
              <SubmitButton>Salvar</SubmitButton>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
