import { BadgeCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SaleRow } from "@/components/deals/sale-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, Th, THead } from "@/components/ui/table";
import { brl } from "@/lib/format";
import { listDeals } from "@/lib/queries/deals";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendas" };

export default function SalesPage() {
  const sold = listDeals()
    .filter((d) => d.stage === "vendido" || d.stage === "entregue")
    .sort((a, b) => ((a.sold_date ?? "") < (b.sold_date ?? "") ? 1 : -1));

  const totals = sold.reduce(
    (acc, d) => {
      acc.revenue += d.sale_price ?? 0;
      acc.profit += d.sale_price != null ? d.sale_price - d.vehicle_total_cost : 0;
      acc.pending += d.pending;
      return acc;
    },
    { revenue: 0, profit: 0, pending: 0 }
  );

  return (
    <>
      <PageHeader
        title="Vendas"
        description="Cada carro vendido fica registrado aqui — clique na linha para ver ou alterar a venda."
      />

      {sold.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="Nenhuma venda registrada"
          description="Venda pelo botão verde “Vendido” na tela de Veículos e o carro aparece aqui."
        />
      ) : (
        <Table>
          <THead>
            <Th>Data</Th>
            <Th>Veículo</Th>
            <Th>Cliente</Th>
            <Th>Canal</Th>
            <Th right>Venda</Th>
            <Th right>Lucro</Th>
            <Th right>Recebido</Th>
            <Th right>A receber</Th>
            <Th>Status</Th>
          </THead>
          <TBody>
            {sold.map((d) => (
              <SaleRow key={d.id} deal={d} />
            ))}
          </TBody>
          <tfoot className="border-t border-zinc-200 bg-zinc-50/60 text-[13px]">
            <tr>
              <td colSpan={4} className="px-2.5 py-2.5 font-semibold text-zinc-900">
                Total · {sold.length} venda(s)
              </td>
              <td className="px-2.5 py-2.5 text-right font-semibold tabular-nums text-zinc-900">
                {brl(totals.revenue)}
              </td>
              <td
                className={`px-2.5 py-2.5 text-right font-semibold tabular-nums ${
                  totals.profit >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {brl(totals.profit)}
              </td>
              <td />
              <td className="px-2.5 py-2.5 text-right font-semibold tabular-nums text-amber-600">
                {totals.pending > 0 ? brl(totals.pending) : ""}
              </td>
              <td />
            </tr>
          </tfoot>
        </Table>
      )}
    </>
  );
}
