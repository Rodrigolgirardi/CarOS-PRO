"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { savePayable, saveReceivable } from "@/lib/actions/finance";
import { PAYABLE_CATEGORIES } from "@/lib/labels";
import type { CustomerOption } from "@/lib/queries/customers";
import type { VehicleOption } from "@/lib/queries/vehicles";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, Input, Select } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

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
