import { BadgeCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DealCard } from "@/components/deals/deal-card";
import { NewDealButton } from "@/components/deals/new-deal-button";
import { SaleRow } from "@/components/deals/sale-row";
import { DealStageBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, Th, THead } from "@/components/ui/table";
import { brl } from "@/lib/format";
import { customerOptions } from "@/lib/queries/customers";
import { listDeals } from "@/lib/queries/deals";
import { vehicleOptions } from "@/lib/queries/vehicles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendas" };

export default function SalesPage() {
  const deals = listDeals();
  const customers = customerOptions();
  const vehicles = vehicleOptions(); // só não vendidos

  const sold = deals
    .filter((d) => d.stage === "vendido" || d.stage === "entregue")
    .sort((a, b) => ((a.sold_date ?? "") < (b.sold_date ?? "") ? 1 : -1));
  const active = deals.filter((d) => ["interessado", "proposta", "reservado"].includes(d.stage));
  const lost = deals.filter((d) => d.stage === "perdido");

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
        actions={<NewDealButton vehicles={vehicles} customers={customers} />}
      />

      {sold.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="Nenhuma venda registrada"
          description="Venda pelo botão verde “Vendido” na tela de Veículos (ou por uma negociação) e o carro aparece aqui."
        />
      ) : (
        <Table>
          <THead>
            <Th>Data</Th>
            <Th>Veículo</Th>
            <Th>Cliente</Th>
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
              <td colSpan={3} className="px-2.5 py-2.5 font-semibold text-zinc-900">
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

      {active.length > 0 && (
        <details className="mt-6 rounded-xl border border-zinc-200 bg-white open:pb-3">
          <summary className="cursor-pointer select-none px-4 py-3 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900">
            Negociações em andamento ({active.length})
          </summary>
          <div className="grid grid-cols-1 gap-2 border-t border-zinc-100 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        </details>
      )}

      {lost.length > 0 && (
        <details className="mt-4 rounded-xl border border-zinc-200 bg-white open:pb-2">
          <summary className="cursor-pointer select-none px-4 py-3 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900">
            Negociações perdidas ({lost.length})
          </summary>
          <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
            {lost.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-zinc-700">
                    <span className="font-medium">{d.vehicle_label}</span> · {d.customer_name}
                  </p>
                  {d.notes && <p className="truncate text-xs text-zinc-400">{d.notes}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {d.proposed_price != null && (
                    <span className="text-[13px] tabular-nums text-zinc-500">{brl(d.proposed_price)}</span>
                  )}
                  <DealStageBadge stage={d.stage} />
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
