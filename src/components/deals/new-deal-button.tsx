"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createDeal } from "@/lib/actions/deals";
import { brl } from "@/lib/format";
import type { CustomerOption } from "@/lib/queries/customers";
import type { VehicleOption } from "@/lib/queries/vehicles";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

interface NewDealButtonProps {
  vehicles: VehicleOption[]; // apenas não vendidos
  customers: CustomerOption[];
  vehicleId?: number;
  label?: string;
}

/** Inicia uma negociação: interessado ou já com proposta. */
export function NewDealButton({ vehicles, customers, vehicleId, label = "Nova negociação" }: NewDealButtonProps) {
  const [open, setOpen] = useState(false);
  const [withProposal, setWithProposal] = useState(false);
  const [customerValue, setCustomerValue] = useState("");
  const newCustomer = customerValue === "novo";
  const { state, formAction } = useAction(createDeal, { onSuccess: () => setOpen(false) });

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus size={14} />
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova negociação">
        <form action={formAction} className="space-y-4">
          <Field label="Cliente" required>
            <Select
              name="customer_id"
              value={customerValue}
              onChange={(e) => setCustomerValue(e.target.value)}
              required
            >
              <option value="" disabled>
                Escolha…
              </option>
              <option value="novo">＋ Cadastrar novo cliente…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.city ? ` · ${c.city}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          {newCustomer && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-100 bg-zinc-50/60 p-3">
              <Field label="Nome" required>
                <Input name="new_customer_name" placeholder="Marcos Vieira" required autoFocus />
              </Field>
              <Field label="Telefone">
                <Input name="new_customer_phone" placeholder="(11) 99999-0000" />
              </Field>
            </div>
          )}
          {vehicleId != null ? (
            <input type="hidden" name="vehicle_id" value={vehicleId} />
          ) : (
            <Field label="Veículo" required>
              <Select name="vehicle_id" defaultValue="" required>
                <option value="" disabled>
                  Escolha…
                </option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                    {v.sale_price != null ? ` · ${brl(v.sale_price)}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Situação">
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-[13px] font-medium transition-colors ${
                  !withProposal ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                }`}
              >
                <input
                  type="radio"
                  name="stage"
                  value="interessado"
                  checked={!withProposal}
                  onChange={() => setWithProposal(false)}
                  className="sr-only"
                />
                Interessado
              </label>
              <label
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-[13px] font-medium transition-colors ${
                  withProposal ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                }`}
              >
                <input
                  type="radio"
                  name="stage"
                  value="proposta"
                  checked={withProposal}
                  onChange={() => setWithProposal(true)}
                  className="sr-only"
                />
                Já fez proposta
              </label>
            </div>
          </Field>
          {withProposal && (
            <Field label="Valor da proposta" required>
              <CurrencyInput name="proposed_price" required autoFocus />
            </Field>
          )}
          <Field label="Observações">
            <Textarea name="notes" placeholder="Procura carro automático, quer fechar este mês…" />
          </Field>
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton>Criar negociação</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
