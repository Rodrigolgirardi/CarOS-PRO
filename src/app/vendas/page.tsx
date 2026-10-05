import Link from "next/link";
import { BadgeCheck, Clock, Percent, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SaleRow } from "@/components/deals/sale-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Chips } from "@/components/ui/tabs";
import { Table, TBody, Th, THead } from "@/components/ui/table";
import { brl, fmtDate, pct } from "@/lib/format";
import { listDeals } from "@/lib/queries/deals";
import type { DealRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendas" };

const daysToSell = (d: DealRow): number | null => {
  if (!d.sold_date || !d.purchase_date) return null;
  const days = Math.round((Date.parse(d.sold_date) - Date.parse(d.purchase_date)) / 86_400_000);
  return days >= 0 ? days : null;
};

function HighlightCard({
  icon: Icon,
  title,
  deal,
  value,
  sub,
}: {
  icon: typeof Trophy;
  title: string;
  deal: DealRow;
  value: string;
  sub: string;
}) {
  return (
    <Link
      href={`/veiculos/${deal.vehicle_id}`}
      className="group rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300"
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        <Icon size={14} className="text-zinc-400" />
        {title}
      </p>
      <p className="mt-2 truncate text-[13px] font-semibold text-zinc-900 group-hover:underline group-hover:underline-offset-2">
        {deal.vehicle_label}
      </p>
      {deal.vehicle_plate && (
        <span className="mt-1 inline-block rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
          {deal.vehicle_plate}
        </span>
      )}
      <p className="mt-2.5 text-xl font-semibold tabular-nums tracking-tight text-emerald-600">{value}</p>
      <p className="mt-0.5 truncate text-xs text-zinc-400">{sub}</p>
    </Link>
  );
}

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: tabParam } = await searchParams;
  const tab = tabParam === "destaques" ? "destaques" : "vendas";
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

      <Chips
        className="mb-4"
        activeKey={tab}
        items={[
          { key: "vendas", label: "Vendas", count: sold.length, href: "/vendas" },
          { key: "destaques", label: "Destaques", href: "/vendas?tab=destaques" },
        ]}
      />

      {sold.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="Nenhuma venda registrada"
          description="Venda pelo botão verde “Vendido” na tela de Veículos e o carro aparece aqui."
        />
      ) : tab === "destaques" ? (
        (() => {
          const priced = sold.filter((d) => d.sale_price != null);
          const biggest = priced.length
            ? priced.reduce((a, b) => ((b.sale_price ?? 0) > (a.sale_price ?? 0) ? b : a))
            : null;
          const margin = (d: DealRow) =>
            d.sale_price != null && d.sale_price > 0 ? (d.sale_price - d.vehicle_total_cost) / d.sale_price : null;
          const withMargin = priced.filter((d) => margin(d) != null);
          const bestMargin = withMargin.length
            ? withMargin.reduce((a, b) => ((margin(b) ?? -Infinity) > (margin(a) ?? -Infinity) ? b : a))
            : null;
          const withDays = sold.filter((d) => daysToSell(d) != null);
          const fastest = withDays.length
            ? withDays.reduce((a, b) => ((daysToSell(b) ?? Infinity) < (daysToSell(a) ?? Infinity) ? b : a))
            : null;
          return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {biggest && (
                <HighlightCard
                  icon={Trophy}
                  title="Maior valor de venda"
                  deal={biggest}
                  value={brl(biggest.sale_price)}
                  sub={`${biggest.customer_name} · ${fmtDate(biggest.sold_date)}`}
                />
              )}
              {bestMargin && (
                <HighlightCard
                  icon={Percent}
                  title="Maior margem"
                  deal={bestMargin}
                  value={pct(margin(bestMargin))}
                  sub={`Lucro de ${brl((bestMargin.sale_price ?? 0) - bestMargin.vehicle_total_cost)} em ${brl(bestMargin.sale_price)}`}
                />
              )}
              {fastest && (
                <HighlightCard
                  icon={Clock}
                  title="Vendido mais rápido"
                  deal={fastest}
                  value={`${daysToSell(fastest)} dia(s)`}
                  sub={`Comprado em ${fmtDate(fastest.purchase_date)}, vendido em ${fmtDate(fastest.sold_date)}`}
                />
              )}
            </div>
          );
        })()
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
