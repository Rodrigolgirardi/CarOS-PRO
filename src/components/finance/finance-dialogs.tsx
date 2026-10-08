"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { addCashMovement, savePayable, saveReceivable } from "@/lib/actions/finance";
import { todayISO } from "@/lib/format";
import { PAYABLE_CATEGORIES } from "@/lib/labels";
import { cn } from "@/lib/cn";
import type { CustomerOption } from "@/lib/queries/customers";
import type { VehicleOption } from "@/lib/queries/vehicles";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, Input, Select } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

/** Gasto ou receita avulsos, direto no caixa — data de hoje por padrão. */
export function AddMovementButton({ vehicles }: { vehicles: VehicleOption[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"gasto" | "receita">("gasto");
  const { state, formAction } = useAction(addCashMovement, { onSuccess: () => setOpen(false) });
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus size={14} />
        Adicionar gasto/receita
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Adicionar gasto/receita"
        description="Entra direto no fluxo de caixa, na data escolhida."
      >
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="type" value={type} />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("gasto")}
              className={cn(
                "h-9 rounded-md border text-[13px] font-medium transition-colors",
                type === "gasto"
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
              )}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType("receita")}
              className={cn(
                "h-9 rounded-md border text-[13px] font-medium transition-colors",
                type === "receita"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
              )}
            >
              Receita
            </button>
          </div>
          <Field label="Descrição" required>
            <Input
              name="description"
              placeholder={type === "gasto" ? "Conta de luz, aluguel…" : "Documentação, serviço…"}
              required
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor" required>
              <CurrencyInput name="amount" required />
            </Field>
            <Field label="Data">
              <Input type="date" name="date" defaultValue={todayISO()} />
            </Field>
            {type === "gasto" && (
              <>
                <Field label="Categoria">
                  <Select name="category" defaultValue="Outros">
                    {PAYABLE_CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Veículo (opcional)">
                  <Select name="vehicle_id" defaultValue="">
                    <option value="">—</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            )}
          </div>
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton>{type === "gasto" ? "Lançar gasto" : "Lançar receita"}</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function NewPayableButton({ vehicles }: { vehicles: VehicleOption[] }) {
  const [open, setOpen] = useState(false);
  const { state, formAction } = useAction(savePayable.bind(null, null), { onSuccess: () => setOpen(false) });
  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Plus size={13} />
        Nova conta a pagar
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova conta a pagar">
        <form action={formAction} className="space-y-4">
          <Field label="Descrição" required>
            <Input name="description" placeholder="IPVA 2026 — Compass" required autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoria">
              <Select name="category" defaultValue="Outros">
                {PAYABLE_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Valor" required>
              <CurrencyInput name="amount" required />
            </Field>
            <Field label="Vencimento" required>
              <Input type="date" name="due_date" required />
            </Field>
            <Field label="Veículo (opcional)">
              <Select name="vehicle_id" defaultValue="">
                <option value="">—</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
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

export function NewReceivableButton({ customers }: { customers: CustomerOption[] }) {
  const [open, setOpen] = useState(false);
  const { state, formAction } = useAction(saveReceivable.bind(null, null), { onSuccess: () => setOpen(false) });
  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Plus size={13} />
        Nova conta a receber
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nova conta a receber"
        description="Recebíveis de vendas são criados automaticamente ao registrar a venda."
      >
        <form action={formAction} className="space-y-4">
          <Field label="Descrição" required>
            <Input name="description" placeholder="Aluguel de vaga — Outubro" required autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor" required>
              <CurrencyInput name="amount" required />
            </Field>
            <Field label="Vencimento" required>
              <Input type="date" name="due_date" required />
            </Field>
          </div>
          <Field label="Cliente (opcional)">
            <Select name="customer_id" defaultValue="">
              <option value="">—</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
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
