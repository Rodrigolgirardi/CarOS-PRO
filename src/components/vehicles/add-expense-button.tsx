"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { addCostForVehicle } from "@/lib/actions/costs";
import { todayISO } from "@/lib/format";
import { COST_CATEGORY } from "@/lib/labels";
import type { VehicleOption } from "@/lib/queries/vehicles";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, Input, Select } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

/** Lançamento rápido de gasto a partir da lista: escolhe o veículo no próprio modal. */
export function AddExpenseButton({ vehicles }: { vehicles: VehicleOption[] }) {
  const [open, setOpen] = useState(false);
  const { state, formAction } = useAction(addCostForVehicle, {
    onSuccess: () => setOpen(false),
  });

  return (
    <>
      <Button variant="warning" onClick={() => setOpen(true)} disabled={vehicles.length === 0}>
        <Receipt size={14} />
        Adicionar gasto
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Adicionar gasto"
        description="O gasto entra direto no custo total e no lucro do veículo escolhido."
      >
        <form action={formAction} className="space-y-4">
          <Field label="Veículo" required>
            <Select name="vehicle_id" required defaultValue="">
              <option value="" disabled>
                Escolha o veículo…
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                  {v.plate ? ` — ${v.plate}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoria" required>
              <Select name="category" defaultValue="manutencao" required>
                {Object.entries(COST_CATEGORY).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Valor" required>
              <CurrencyInput name="amount" required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data">
              <Input type="date" name="date" defaultValue={todayISO()} />
            </Field>
            <Field label="Descrição">
              <Input name="description" placeholder="Troca de óleo e filtros" />
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
