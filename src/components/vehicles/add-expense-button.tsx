"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { addCostForVehicle } from "@/lib/actions/costs";
import { todayISO } from "@/lib/format";
import { ADMIN_EXPENSE_TYPES, COST_CATEGORY } from "@/lib/labels";
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
  const [target, setTarget] = useState(""); // "" (escolher) | "admin" | id do veículo
  const admin = target === "admin";
  // "Qual o gasto?": lista administrativa + tipos criados em Configurações, sem repetir nomes
  const adminTypes = [
    ...ADMIN_EXPENSE_TYPES.filter((t) => t !== "Outros"),
    ...extraCategories.filter(
      (c) => !ADMIN_EXPENSE_TYPES.some((t) => t.toLowerCase() === c.toLowerCase())
    ),
    "Outros",
  ];
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
            ? "Gasto da loja (pró-labore, água, luz…) — entra no caixa, mas não no custo de nenhum carro."
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
          {admin ? (
            // administrativo: obrigatório dizer qual é o gasto
            <Field label="Qual o gasto?" required>
              <Select key="admin" name="admin_type" defaultValue="" required>
                <option value="" disabled>
                  Escolha: pró-labore, água, luz…
                </option>
                {adminTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            target !== "" && (
              <Field label="Categoria" required>
                <Select key="car" name="category" defaultValue="" required>
                  <option value="" disabled>
                    Escolha a categoria…
                  </option>
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
            )
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor" required>
              <CurrencyInput name="amount" required />
            </Field>
            <Field label="Data">
              <Input type="date" name="date" defaultValue={todayISO()} />
            </Field>
          </div>
          <Field label="Descrição">
            <Input name="description" placeholder={admin ? "Ex.: pró-labore de outubro" : "Ex.: troca de óleo e filtros"} />
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
