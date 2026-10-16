"use client";

import { Trash2 } from "lucide-react";
import { deleteCommissionRule, saveCommissionRule } from "@/lib/actions/commissions";
import type { CommissionRule } from "@/lib/queries/commissions";
import { ConfirmButton } from "@/components/ui/confirm";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";

/** Linha editável da tabela de comissões padrão. */
export function CommissionRuleRow({ rule }: { rule: CommissionRule }) {
  const { state, formAction } = useAction(saveCommissionRule.bind(null, rule.key));

  return (
    // celular: nome inteiro em cima, valor + salvar + lixeira embaixo · desktop: tudo numa linha
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 lg:flex-nowrap">
      <p className="basis-full text-[13px] font-medium text-zinc-800 lg:min-w-0 lg:flex-1 lg:basis-auto lg:truncate">
        {rule.label}
      </p>
      <form action={formAction} className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
        <FormError state={state} />
        <CurrencyInput
          name="amount"
          defaultCents={rule.amount}
          placeholder="em branco"
          className="min-w-0 flex-1 lg:w-36 lg:flex-none"
        />
        <SubmitButton variant="secondary">Salvar</SubmitButton>
      </form>
      <ConfirmButton
        action={deleteCommissionRule.bind(null, rule.key)}
        title={`Remover "${rule.label}"?`}
        description="O tipo some das sugestões de comissão. Comissões já pagas não mudam."
        variant="danger-ghost"
        className="size-8 shrink-0 p-0"
      >
        <Trash2 size={15} />
      </ConfirmButton>
    </div>
  );
}
