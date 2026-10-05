"use client";

import { saveCommissionRule } from "@/lib/actions/commissions";
import type { CommissionRule } from "@/lib/queries/commissions";
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
    </div>
  );
}
