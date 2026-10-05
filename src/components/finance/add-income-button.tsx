"use client";

import { useState } from "react";
import { Banknote } from "lucide-react";
import { addIncome } from "@/lib/actions/finance";
import { todayISO } from "@/lib/format";
import type { Seller } from "@/lib/types";
import type { CommissionRule } from "@/lib/queries/commissions";
import type { CustomerOption } from "@/lib/queries/customers";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, Input, Select } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

interface AddIncomeButtonProps {
  customers: CustomerOption[];
  sellers: Seller[];
  /** regras da aba Comissões — o tipo escolhido sugere a comissão */
  rules: CommissionRule[];
}

/** Entrada avulsa: documentação, financiamento, venda de moto… com comissão sugerida pelo tipo. */
export function AddIncomeButton({ customers, sellers, rules }: AddIncomeButtonProps) {
  const [open, setOpen] = useState(false);
  const [typeKey, setTypeKey] = useState("");
  const { state, formAction } = useAction(addIncome, { onSuccess: () => setOpen(false) });

  const rule = rules.find((r) => r.key === typeKey);
  const suggested = rule?.amount ?? null;

  return (
    <>
      <Button variant="info" onClick={() => setOpen(true)}>
        <Banknote size={14} />
        Adicionar entrada
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Adicionar entrada"
        description="Dinheiro recebido fora da venda do carro: documentação, financiamento, moto… Entra no caixa na data informada."
      >
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo" hint="Define a comissão sugerida.">
              <Select value={typeKey} onChange={(e) => setTypeKey(e.target.value)}>
                <option value="">—</option>
                {rules.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Data">
              <Input type="date" name="date" defaultValue={todayISO()} />
            </Field>
          </div>
          <Field label="Descrição" required>
            <Input
              name="description"
              placeholder={rule ? `${rule.label} — Fiat Toro` : "Documentação — Fiat Toro"}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor recebido" required>
              <CurrencyInput name="amount" required />
            </Field>
            <Field label="Comissão" hint="Sugerida pelo tipo — ajuste se precisar. Vai para Contas a pagar.">
              <CurrencyInput key={typeKey} name="commission" defaultCents={suggested} />
            </Field>
            <Field label="Vendedor">
              <Select name="seller_id" defaultValue="">
                <option value="">—</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
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
          </div>
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton>Registrar entrada</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
