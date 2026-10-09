"use client";

import { useState } from "react";
import { Banknote } from "lucide-react";
import { addIncome } from "@/lib/actions/finance";
import { todayISO } from "@/lib/format";
import { INCOME_TYPES } from "@/lib/labels";
import type { Seller } from "@/lib/types";
import type { CommissionRule } from "@/lib/queries/commissions";
import type { CustomerOption } from "@/lib/queries/customers";
import { ChipInner, chipCls } from "@/components/ui/action-chip";
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

/**
 * Entrada avulsa (financiamento, despachante, aporte, empréstimo…). Venda de
 * veículo NÃO entra aqui: o botão Venda já lança o recebimento no caixa.
 */
export function AddIncomeButton({ customers, sellers, rules, chip }: AddIncomeButtonProps & { chip?: boolean }) {
  const [open, setOpen] = useState(false);
  const [typeKey, setTypeKey] = useState("");
  const { state, formAction } = useAction(addIncome, { onSuccess: () => setOpen(false) });

  const type = INCOME_TYPES.find((t) => t.key === typeKey);
  const suggested = type?.rule ? (rules.find((r) => r.key === type.rule)?.amount ?? null) : null;
  // aporte e empréstimo não são serviço vendido: sem comissão nem vendedor
  const withCommission = type?.commission ?? true;

  return (
    <>
      {chip ? (
        <button type="button" onClick={() => setOpen(true)} className={chipCls("blue", "justify-center! px-2")}>
          <ChipInner icon={Banknote} label="Entrada" color="blue" compact />
        </button>
      ) : (
        <Button variant="info" onClick={() => setOpen(true)}>
          <Banknote size={14} />
          Adicionar entrada
        </Button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Adicionar entrada"
        description="Dinheiro que entra fora da venda de veículos (a venda já entra no caixa pelo botão Venda)."
      >
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Recebimento por" required>
              <Select name="income_type" required value={typeKey} onChange={(e) => setTypeKey(e.target.value)}>
                <option value="" disabled>
                  Escolha…
                </option>
                {INCOME_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Data">
              <Input type="date" name="date" defaultValue={todayISO()} />
            </Field>
          </div>
          <Field label="Descrição" hint={type ? `Fica como “${type.label} — …” no caixa.` : undefined}>
            <Input name="description" placeholder={type?.example ?? "Ex.: Financiamento — Fiat Toro"} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor recebido" required>
              <CurrencyInput name="amount" required />
            </Field>
            {withCommission && (
              <Field label="Comissão" hint="Sugerida pelo tipo — ajuste se precisar. Vai para Contas a pagar.">
                <CurrencyInput key={typeKey} name="commission" defaultCents={suggested} />
              </Field>
            )}
            {withCommission && (
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
            )}
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
