import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { BrandLogo } from "@/components/vehicles/brand-logo";
import { VehicleStatusBadge } from "@/components/ui/badge";
import { Stat, StatGrid } from "@/components/ui/stat";
import { Chips, LinkTabs } from "@/components/ui/tabs";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { brl, fmtDate, pct } from "@/lib/format";
import { vehicleMetrics } from "@/lib/metrics";
import {
  PERIOD_LABEL,
  purchasesReport,
  salesReport,
  stockReport,
  vehicleRankings,
  type Period,
} from "@/lib/queries/reports";
import { VEHICLE_STATUS } from "@/lib/labels";
import type { VehicleRow, VehicleStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Relatórios" };

const PERIODS: Period[] = ["mes", "30", "ano", "tudo"];

function VehicleCell({ v }: { v: VehicleRow }) {
  return (
    <Link href={`/veiculos/${v.id}`} className="block min-w-0">
      <span className="flex items-center gap-1.5 font-medium text-zinc-900 group-hover:underline group-hover:underline-offset-2">
        <BrandLogo brand={v.brand} size={14} />
        <span className="truncate">
          {v.brand} {v.model}
        </span>
      </span>
      <span className="block truncate text-xs text-zinc-400">
        {v.version ?? ""}
        {v.plate ? ` · ${v.plate}` : ""}
      </span>
    </Link>
  );
}

function RankCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <h3 className="border-b border-zinc-100 px-4 py-2.5 text-[13px] font-semibold text-zinc-900">{title}</h3>
      {children}
    </section>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; periodo?: string }>;
}) {
  const sp = await searchParams;
  const tab = ["estoque", "vendas", "compras", "veiculos"].includes(sp.tab ?? "") ? sp.tab! : "estoque";
  const periodo: Period = PERIODS.includes(sp.periodo as Period) ? (sp.periodo as Period) : "tudo";

  return (
    <>
      <PageHeader title="Relatórios" description="Os números que importam, sem enfeite." />

      <LinkTabs
        className="mb-5"
        activeKey={tab}
        tabs={[
          { key: "estoque", label: "Estoque", href: "/relatorios" },
          { key: "vendas", label: "Vendas", href: "/relatorios?tab=vendas" },
          { key: "compras", label: "Compras", href: "/relatorios?tab=compras" },
          { key: "veiculos", label: "Veículos", href: "/relatorios?tab=veiculos" },
        ]}
      />

      {tab === "estoque" && (() => {
        const r = stockReport();
        return (
          <div className="space-y-5">
            <StatGrid className="grid-cols-2 md:grid-cols-5">
              <Stat label="Veículos" value={r.count} />
              <Stat label="Capital investido" value={brl(r.invested)} />
              <Stat label="Valor potencial de venda" value={brl(r.saleValue)} />
              <Stat
                label="Lucro potencial"
                value={brl(r.potentialProfit)}
                valueClassName={r.potentialProfit >= 0 ? "text-emerald-600" : "text-red-600"}
              />
              <Stat label="Dias médios em estoque" value={r.avgDays ?? "—"} />
            </StatGrid>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
              <RankCard title="Por status">
                <ul className="divide-y divide-zinc-100">
                  {r.byStatus.map((s) => (
                    <li key={s.status} className="flex items-center justify-between gap-2 px-4 py-2.5">
                      <VehicleStatusBadge status={s.status as VehicleStatus} />
                      <span className="text-[13px] text-zinc-500">
                        {s.n} · <span className="font-medium text-zinc-900 tabular-nums">{brl(s.invested)}</span>
                      </span>
                    </li>
                  ))}
                  {r.byStatus.length === 0 && <li className="px-4 py-4 text-[13px] text-zinc-400">Estoque vazio.</li>}
                </ul>
              </RankCard>

              <RankCard title="Envelhecimento do estoque">
                <Table flush>
                  <THead>
                    <Th>Veículo</Th>
                    <Th>Status</Th>
                    <Th right>Custo total</Th>
                    <Th right>Preço</Th>
                    <Th right>Dias</Th>
                  </THead>
                  <TBody>
                    {r.rows.map((v) => {
                      const m = vehicleMetrics(v);
                      return (
                        <Tr key={v.id}>
                          <Td className="max-w-[240px]">
                            <VehicleCell v={v} />
                          </Td>
                          <Td>
                            <VehicleStatusBadge status={v.status} />
                          </Td>
                          <Td right>{brl(v.total_cost)}</Td>
                          <Td right className="text-zinc-500">
                            {brl(v.sale_price)}
                          </Td>
                          <Td right className={(m.days ?? 0) > 60 ? "font-semibold text-amber-600" : "font-medium"}>
                            {m.days}
                          </Td>
                        </Tr>
                      );
                    })}
                  </TBody>
                </Table>
              </RankCard>
            </div>
          </div>
        );
      })()}

      {tab === "vendas" && (() => {
        const r = salesReport(periodo);
        return (
          <div className="space-y-5">
            <Chips
              activeKey={periodo}
              items={PERIODS.map((p) => ({ key: p, label: PERIOD_LABEL[p], href: `/relatorios?tab=vendas&periodo=${p}` }))}
            />
            <StatGrid className="grid-cols-2 md:grid-cols-5">
              <Stat label="Vendas" value={r.count} />
              <Stat label="Faturamento" value={brl(r.revenue)} />
              <Stat label="Lucro" value={brl(r.profit)} valueClassName={r.profit >= 0 ? "text-emerald-600" : "text-red-600"} />
              <Stat label="Margem" value={pct(r.margin)} />
              <Stat label="Ticket médio" value={brl(r.avgTicket)} sub={r.avgDaysToSell != null ? `${r.avgDaysToSell} dias até vender` : undefined} />
            </StatGrid>
            {r.rows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-6 py-10 text-center text-[13px] text-zinc-400">
                Nenhuma venda no período.
              </p>
            ) : (
              <Table>
                <THead>
                  <Th>Data</Th>
                  <Th>Veículo</Th>
                  <Th>Cliente</Th>
                  <Th right>Venda</Th>
                  <Th right>Custo total</Th>
                  <Th right>Lucro</Th>
                  <Th right>Margem</Th>
                  <Th right>Dias até vender</Th>
                </THead>
                <TBody>
                  {r.rows.map((v) => (
                    <Tr key={v.id}>
                      <Td className="text-zinc-500">{fmtDate(v.sold_date)}</Td>
                      <Td className="max-w-[220px]">
                        <VehicleCell v={v} />
                      </Td>
                      <Td className="max-w-[160px] truncate">
                        {v.buyer_id ? (
                          <Link href={`/clientes/${v.buyer_id}`} className="text-zinc-600 underline-offset-2 hover:underline">
                            {v.buyer_name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td right>{brl(v.sold_price)}</Td>
                      <Td right className="text-zinc-500">
                        {brl(v.total_cost)}
                      </Td>
                      <Td right className={v.profit != null && v.profit < 0 ? "font-medium text-red-600" : "font-medium text-emerald-600"}>
                        {brl(v.profit)}
                      </Td>
                      <Td right className="text-zinc-500">
                        {pct(v.margin)}
                      </Td>
                      <Td right className="text-zinc-500">
                        {v.daysToSell ?? "—"}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        );
      })()}

      {tab === "compras" && (() => {
        const r = purchasesReport(periodo);
        return (
          <div className="space-y-5">
            <Chips
              activeKey={periodo}
              items={PERIODS.map((p) => ({ key: p, label: PERIOD_LABEL[p], href: `/relatorios?tab=compras&periodo=${p}` }))}
            />
            <StatGrid className="grid-cols-3">
              <Stat label="Veículos comprados" value={r.count} />
              <Stat label="Valor comprado" value={brl(r.totalPurchase)} />
              <Stat label="Custo total médio" value={brl(r.avgCost)} sub="Compra + custos por veículo" />
            </StatGrid>
            {r.rows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-6 py-10 text-center text-[13px] text-zinc-400">
                Nenhuma compra no período.
              </p>
            ) : (
              <Table>
                <THead>
                  <Th>Data</Th>
                  <Th>Veículo</Th>
                  <Th>Vendedor</Th>
                  <Th right>Preço de compra</Th>
                  <Th right>Custos</Th>
                  <Th right>Custo total</Th>
                  <Th>Status</Th>
                </THead>
                <TBody>
                  {r.rows.map((v) => (
                    <Tr key={v.id}>
                      <Td className="text-zinc-500">{fmtDate(v.purchase_date)}</Td>
                      <Td className="max-w-[220px]">
                        <VehicleCell v={v} />
                      </Td>
                      <Td className="max-w-[200px] truncate text-zinc-600">{v.purchase_seller ?? "—"}</Td>
                      <Td right>{brl(v.purchase_price)}</Td>
                      <Td right className="text-zinc-500">
                        {brl(v.costs_total)}
                      </Td>
                      <Td right className="font-medium">
                        {brl(v.total_cost)}
                      </Td>
                      <Td>
                        <VehicleStatusBadge status={v.status} />
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        );
      })()}

      {tab === "veiculos" && (() => {
        const r = vehicleRankings();
        const money = (v: number | null) => (v == null ? "—" : brl(v));
        return (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <RankCard title="Mais lucrativos (vendidos)">
              <ul className="divide-y divide-zinc-100">
                {r.topProfit.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <Link
                      href={`/veiculos/${v.id}`}
                      className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-zinc-800 underline-offset-2 hover:underline"
                    >
                      <BrandLogo brand={v.brand} size={14} />
                      <span className="truncate">
                        {v.brand} {v.model} {v.version ?? ""}
                      </span>
                    </Link>
                    <span className="shrink-0 text-[13px] font-semibold tabular-nums text-emerald-600">{money(v.profit)}</span>
                  </li>
                ))}
                {r.topProfit.length === 0 && <li className="px-4 py-4 text-[13px] text-zinc-400">Nenhuma venda ainda.</li>}
              </ul>
            </RankCard>
            <RankCard title="Maior margem (vendidos)">
              <ul className="divide-y divide-zinc-100">
                {r.topMargin.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <Link
                      href={`/veiculos/${v.id}`}
                      className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-zinc-800 underline-offset-2 hover:underline"
                    >
                      <BrandLogo brand={v.brand} size={14} />
                      <span className="truncate">
                        {v.brand} {v.model} {v.version ?? ""}
                      </span>
                    </Link>
                    <span className="shrink-0 text-[13px] font-semibold tabular-nums text-zinc-900">{pct(v.margin)}</span>
                  </li>
                ))}
                {r.topMargin.length === 0 && <li className="px-4 py-4 text-[13px] text-zinc-400">Nenhuma venda ainda.</li>}
              </ul>
            </RankCard>
            <RankCard title="Mais tempo em estoque (atual)">
              <ul className="divide-y divide-zinc-100">
                {r.longestInStock.map((v) => {
                  const m = vehicleMetrics(v);
                  return (
                    <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <Link href={`/veiculos/${v.id}`} className="truncate text-[13px] font-medium text-zinc-800 underline-offset-2 hover:underline">
                        {v.brand} {v.model} {v.version ?? ""}
                      </Link>
                      <span className={`shrink-0 text-[13px] font-semibold tabular-nums ${(m.days ?? 0) > 60 ? "text-amber-600" : "text-zinc-900"}`}>
                        {m.days} dias
                      </span>
                    </li>
                  );
                })}
                {r.longestInStock.length === 0 && <li className="px-4 py-4 text-[13px] text-zinc-400">Estoque vazio.</li>}
              </ul>
            </RankCard>
            <RankCard title="Maior custo total">
              <ul className="divide-y divide-zinc-100">
                {r.highestCost.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <Link
                      href={`/veiculos/${v.id}`}
                      className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-zinc-800 underline-offset-2 hover:underline"
                    >
                      <BrandLogo brand={v.brand} size={14} />
                      <span className="truncate">
                        {v.brand} {v.model} {v.version ?? ""}
                      </span>
                    </Link>
                    <span className="shrink-0 text-[13px] font-semibold tabular-nums text-zinc-900">{brl(v.total_cost)}</span>
                  </li>
                ))}
              </ul>
            </RankCard>
          </div>
        );
      })()}
    </>
  );
}
