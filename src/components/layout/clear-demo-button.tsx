"use client";

import { clearDemoData } from "@/lib/actions/demo";
import { ConfirmButton } from "@/components/ui/confirm";

export function ClearDemoButton() {
  return (
    <ConfirmButton
      action={clearDemoData}
      title="Limpar dados de exemplo?"
      description="Todos os veículos, clientes, lançamentos e documentos fictícios serão removidos — incluindo qualquer registro feito sobre eles. Seus dados reais não são afetados."
      confirmLabel="Limpar tudo"
      redirectTo="/"
      variant="secondary"
      size="sm"
      className="mt-2 h-7 w-full border-amber-200 bg-white/70 text-[11px] text-amber-800 hover:bg-white"
    >
      Limpar dados de exemplo
    </ConfirmButton>
  );
}
