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
    <div className="flex items-center gap-3 px-4 py-2.5">
      <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-zinc-800">{rule.label}</p>
      <form action={formAction} className="flex items-center gap-2">
        <FormError state={state} />
        <CurrencyInput name="amount" defaultCents={rule.amount} placeholder="em branco" className="w-36" />
        <SubmitButton variant="secondary">Salvar</SubmitButton>
      </form>
      {rule.key !== "venda_carro" && (
        <ConfirmButton
          action={deleteCommissionRule.bind(null, rule.key)}
          title={`Remover "${rule.label}"?`}
          description="O tipo some das sugestões de comissão. Comissões já pagas não mudam."
          variant="danger-ghost"
          className="size-8 shrink-0 p-0"
        >
          <Trash2 size={15} />
        </ConfirmButton>
      )}
    </div>
  );
}
