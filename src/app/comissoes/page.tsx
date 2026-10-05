import { Percent } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CommissionRuleRow } from "@/components/commissions/rule-row";
import { listCommissionRules } from "@/lib/queries/commissions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comissões" };

export default function CommissionsPage() {
  const rules = listCommissionRules();

  return (
    <>
      <PageHeader
        title="Comissões"
        description="Valores padrão pagos aos vendedores por tipo de operação — altere quando quiser."
      />

      <div className="max-w-xl divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
        {rules.map((rule) => (
          <CommissionRuleRow key={rule.key} rule={rule} />
        ))}
      </div>

      <p className="mt-3 flex max-w-xl items-center gap-1.5 text-xs text-zinc-400">
        <Percent size={12} />
        A venda rápida sugere a comissão “Venda de carro”; vendedores com comissão própria (em Vendedores) têm prioridade.
      </p>
    </>
  );
}
