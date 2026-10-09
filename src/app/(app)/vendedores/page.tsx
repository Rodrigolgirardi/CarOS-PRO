import { Percent } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AddRuleButton } from "@/components/commissions/add-rule-button";
import { CommissionRuleRow } from "@/components/commissions/rule-row";
import { SellerCreateButton, SellerRowActions } from "@/components/sellers/seller-dialogs";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { brl } from "@/lib/format";
import { listCommissionRules } from "@/lib/queries/commissions";
import { listSellers } from "@/lib/queries/sellers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendedores" };

// Vendedores e comissões padrão vivem juntos: uma tela só para a equipe e os valores.
export default async function SellersPage() {
  const sellers = await listSellers();
  const rules = await listCommissionRules();

  return (
    <>
      <PageHeader
        title="Vendedores"
        description="Quem vende na sua loja, a comissão de cada um e os valores padrão por tipo de operação."
        actions={<SellerCreateButton />}
      />

      {sellers.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="Nenhum vendedor cadastrado"
          description="Cadastre os vendedores e a % padrão de comissão. Ao registrar uma venda pelo botão Venda, a comissão é sugerida automaticamente."
          action={<SellerCreateButton />}
        />
      ) : (
        // mesma largura do bloco de comissões logo abaixo
        <div className="max-w-xl">
        <Table>
          <THead>
            <Th>Vendedor</Th>
            <Th right>Comissão padrão</Th>
            <Th right>Vendas</Th>
            <Th right>Comissão acumulada</Th>
            <Th />
          </THead>
          <TBody>
            {sellers.map((s) => (
              <Tr key={s.id}>
                <Td className="font-medium text-zinc-900">{s.name}</Td>
                <Td right className="tabular-nums text-zinc-600">
                  {s.commission_fixed != null
                    ? `${brl(s.commission_fixed)} por venda`
                    : s.commission_pct != null
                      ? `${String(s.commission_pct).replace(".", ",")}%`
                      : "—"}
                </Td>
                <Td right className="tabular-nums text-zinc-600">
                  {s.sales_count}
                </Td>
                <Td right className="font-medium tabular-nums text-zinc-900">
                  {brl(s.commission_total)}
                </Td>
                <Td className="w-20">
                  <SellerRowActions seller={s} />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
        </div>
      )}

      <section className="mt-8 max-w-xl">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold text-zinc-900">Comissões padrão por operação</h2>
          <AddRuleButton />
        </div>
        <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white shadow-card">
          {rules.map((rule) => (
            <CommissionRuleRow key={rule.key} rule={rule} />
          ))}
        </div>
      </section>
    </>
  );
}
