"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { addCostForVehicle } from "@/lib/actions/costs";
import { todayISO } from "@/lib/format";
import { COST_CATEGORY } from "@/lib/labels";
import type { VehicleOption } from "@/lib/queries/vehicles";
import { ChipInner, chipCls } from "@/components/ui/action-chip";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, Input, Select } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

/** Lançamento rápido de gasto a partir da lista: escolhe o veículo no próprio modal. */
export function AddExpenseButton({
  vehicles,
  chip,
  extraCategories = [],
}: {
  vehicles: VehicleOption[];
  chip?: boolean;
  /** tipos de saída criados em Configurações */
  extraCategories?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(""); // "" | "admin" | id do veículo
  const admin = target === "admin";
  const { state, formAction } = useAction(addCostForVehicle, {
    onSuccess: () => setOpen(false),
  });

  return (
    <>
      {chip ? (
        <button type="button" onClick={() => setOpen(true)} className={chipCls("orange", "justify-center! px-2")}>
          <ChipInner icon={Receipt} label="Saída" color="orange" compact />
        </button>
      ) : (
        <Button variant="warning" onClick={() => setOpen(true)}>
          <Receipt size={14} />
          Adicionar saída
        </Button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Adicionar saída"
        description={
          admin
            ? "Gasto da loja (padaria, água, material…) — entra no caixa, mas não no custo de nenhum carro."
            : "O gasto entra direto no custo total e no lucro do veículo escolhido."
        }
      >
        <form action={formAction} className="space-y-4">
          <Field label="Veículo" required>
            <Select name="vehicle_id" required value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="" disabled>
                Escolha o veículo…
              </option>
              <option value="admin">Gastos administrativos (sem carro)</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                  {v.plate ? ` — ${v.plate}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            {!admin && (
              <Field label="Categoria" required>
                <Select name="category" defaultValue="manutencao" required>
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
            )}
            <Field label="Valor" required>
              <CurrencyInput name="amount" required />
            </Field>
            {admin && (
              <Field label="Data">
                <Input type="date" name="date" defaultValue={todayISO()} />
              </Field>
            )}
          </div>
          {admin ? (
            <Field label="Descrição" required>
              <Input name="description" required placeholder="Padaria, garrafa de água, material da loja…" />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data">
                <Input type="date" name="date" defaultValue={todayISO()} />
              </Field>
              <Field label="Descrição">
                <Input name="description" placeholder="Troca de óleo e filtros" />
              </Field>
            </div>
          )}
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
