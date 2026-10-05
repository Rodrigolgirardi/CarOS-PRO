"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createCommissionRule } from "@/lib/actions/commissions";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, Input } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

/** Cria um novo tipo de comissão (ex.: "Venda de consignado", "Seguro"). */
export function AddRuleButton() {
  const [open, setOpen] = useState(false);
  const { state, formAction } = useAction(createCommissionRule, { onSuccess: () => setOpen(false) });

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus size={14} />
        Adicionar tipo
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Novo tipo de comissão"
        description="O tipo aparece nas sugestões de comissão da venda rápida e das entradas."
      >
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-[1fr_150px] gap-4">
            <Field label="Nome" required>
              <Input name="label" placeholder="Venda de consignado" required autoFocus />
            </Field>
            <Field label="Valor padrão" hint="Pode deixar em branco.">
              <CurrencyInput name="amount" />
            </Field>
          </div>
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton>Criar</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
