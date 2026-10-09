"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { addCost, deleteCost, updateCost } from "@/lib/actions/costs";
import { brl, todayISO } from "@/lib/format";
import { COST_CATEGORY, costLabel } from "@/lib/labels";
import type { Cost } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, Input, Select } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

function CostFields({ cost, extraCategories = [] }: { cost?: Cost; extraCategories?: string[] }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Categoria" required>
          <Select name="category" defaultValue={cost?.category ?? "manutencao"} required>
            {Object.entries(COST_CATEGORY).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
            {/* tipos criados em Configurações → Entradas e saídas */}
            {extraCategories.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Valor" required>
          <CurrencyInput name="amount" defaultCents={cost?.amount} required autoFocus={!cost} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Data">
          <Input type="date" name="date" defaultValue={cost?.date ?? todayISO()} />
        </Field>
        <Field label="Descrição">
          <Input name="description" defaultValue={cost?.description ?? ""} placeholder="Troca de óleo e filtros" />
        </Field>
      </div>
    </>
  );
}

export function AddCostButton({ vehicleId, extraCategories }: { vehicleId: number; extraCategories?: string[] }) {
  const [open, setOpen] = useState(false);
  const { state, formAction } = useAction(addCost.bind(null, vehicleId), {
    onSuccess: () => setOpen(false),
  });

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Plus size={13} />
        Adicionar custo
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Adicionar custo"
        large
        description="O custo entra direto no cálculo do custo total e do lucro."
      >
        <form action={formAction} className="space-y-4">
          <CostFields extraCategories={extraCategories} />
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton>Adicionar</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

/** Ações da linha de custo: lápis (editar) + lixeira. */
export function CostRowActions({ cost, extraCategories }: { cost: Cost; extraCategories?: string[] }) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const { state, formAction } = useAction(updateCost.bind(null, cost.id), {
    onSuccess: () => setEditOpen(false),
  });

  const remove = () =>
    startTransition(async () => {
      const r = await deleteCost(cost.id);
      if (r.ok) setConfirmOpen(false);
      else toast(r.error ?? "Não foi possível remover.", "error");
    });

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        variant="ghost"
        size="sm"
        aria-label="Editar custo"
        className="size-9 p-0"
        onClick={() => setEditOpen(true)}
      >
        <Pencil size={16} />
      </Button>
      <Button
        variant="danger-ghost"
        size="sm"
        aria-label="Remover custo"
        className="size-8 p-0"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 size={16} />
      </Button>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar custo">
        <form action={formAction} className="space-y-4">
          <CostFields cost={cost} extraCategories={extraCategories} />
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
            <SubmitButton>Salvar</SubmitButton>
          </div>
        </form>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Remover custo?"
        description={`${costLabel(cost.category)} de ${brl(cost.amount)} será removido do custo total do veículo.`}
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="danger" onClick={remove} disabled={pending}>
            {pending && <Loader2 size={13} className="animate-spin" />}
            Remover
          </Button>
        </div>
      </Modal>
    </div>
  );
}
