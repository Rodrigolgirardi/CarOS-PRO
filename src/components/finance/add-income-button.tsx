"use client";

import { useState } from "react";
import { Banknote } from "lucide-react";
import { addIncome } from "@/lib/actions/finance";
import { todayISO } from "@/lib/format";
import type { Seller } from "@/lib/types";
import type { CustomerOption } from "@/lib/queries/customers";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, Input, Select } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

interface AddIncomeButtonProps {
  customers: CustomerOption[];
  sellers: Seller[];
}

/** Entrada avulsa: documentação, retorno de financiamento… com comissão opcional do vendedor. */
export function AddIncomeButton({ customers, sellers }: AddIncomeButtonProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [sellerId, setSellerId] = useState<string>("");
  const { state, formAction } = useAction(addIncome, { onSuccess: () => setOpen(false) });

  const seller = sellers.find((s) => String(s.id) === sellerId);
  const suggested =
    seller == null
      ? null
      : seller.commission_fixed != null
        ? seller.commission_fixed
        : seller.commission_pct != null && amount != null
          ? Math.round((amount * seller.commission_pct) / 100)
          : null;

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
        description="Dinheiro recebido fora da venda do carro: documentação, retorno de financiamento… Entra no caixa na data informada."
      >
        <form action={formAction} className="space-y-4">
          <Field label="Descrição" required>
            <Input name="description" placeholder="Documentação — Fiat Toro" required autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor recebido" required>
              <CurrencyInput name="amount" onCentsChange={setAmount} required />
            </Field>
            <Field label="Data">
              <Input type="date" name="date" defaultValue={todayISO()} />
            </Field>
            <Field label="Vendedor">
              <Select name="seller_id" value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
                <option value="">—</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Comissão" hint="Vai para Contas a pagar.">
              <CurrencyInput key={`${sellerId}-${suggested ?? ""}`} name="commission" defaultCents={suggested} />
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
            <SubmitButton>Registrar entrada</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
