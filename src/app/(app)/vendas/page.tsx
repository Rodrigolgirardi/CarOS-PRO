import Link from "next/link";
import { BadgeCheck, Clock, Megaphone, Percent, Trophy } from "lucide-react";
import { CustomersPanel } from "@/components/customers/customers-panel";
import { LeadsPanel } from "@/components/deals/leads-panel";
import { SaleExpandRow } from "@/components/deals/sale-expand-row";
import { SaleRow } from "@/components/deals/sale-row";
import { BrandLogo } from "@/components/vehicles/brand-logo";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, Th, THead } from "@/components/ui/table";
import { brl, fmtDate, pct } from "@/lib/format";
import { listDeals } from "@/lib/queries/deals";
import type { DealRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads" };

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
      className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-card transition-colors hover:border-zinc-300"
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        <Icon size={14} className="text-zinc-400" />
        {title}
      </p>
      <p className="mt-2 truncate text-[13px] font-semibold text-zinc-900 group-hover:underline group-hover:underline-offset-2">
        {deal.vehicle_label}
      </p>
      {deal.vehicle_plate && (
        <span className="mt-1 inline-block rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[11px] text-zinc-500">
          {deal.vehicle_plate}
        </span>
      )}
      <p className="mt-2.5 text-xl font-semibold tabular-nums tracking-tight text-emerald-600">{value}</p>
      <p className="mt-0.5 truncate text-xs text-zinc-500">{sub}</p>
    </Link>
  );
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; busca?: string }>;
}) {
  const { tab: tabParam, status, busca } = await searchParams;
  const tabRaw = tabParam === "clientes" ? "consignantes" : tabParam; // links antigos
  const tab = ["vendas", "consignantes", "relatorio"].includes(tabRaw ?? "") ? tabRaw! : "leads";
  const allDeals = await listDeals();
  const sold = allDeals
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
      {/* abas no mesmo visual dos cards indicadores */}
      <div className="mb-4 grid grid-cols-4 gap-2 sm:max-w-xl sm:gap-2.5 lg:mx-auto lg:max-w-3xl">
        {[
          { key: "leads", label: "Leads", href: "/vendas" },
          { key: "vendas", label: "Vendas", count: sold.length, href: "/vendas?tab=vendas" },
          { key: "consignantes", label: "Consignantes", href: "/vendas?tab=consignantes" },
          { key: "relatorio", label: "Relatório", href: "/vendas?tab=relatorio" },
        ].map((t) => {
          const active = t.key === tab;
          return (
            <Link
              key={t.key}
              href={t.href}
              className={`flex items-center justify-center gap-1.5 rounded-2xl border px-2 py-2.5 text-[12px] font-semibold transition-colors sm:text-[13px] ${
                active
                  ? "border-violet-100 bg-violet-50 text-violet-700"
                  : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
              }`}
            >
              {t.label}
              {t.count != null && t.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-px text-[11px] tabular-nums ${
                    active ? "bg-violet-100 text-violet-700" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {tab === "leads" ? (
        <LeadsPanel deals={allDeals} status={status} busca={busca} />
      ) : tab === "consignantes" ? (
        <CustomersPanel status="consignantes" />
      ) : tab === "relatorio" ? (
        (() => {
          // ---- leads por canal/marketplace
          const byChannel = new Map<string, number>();
          for (const d of allDeals) {
            const k = d.channel?.trim() || "Sem canal";
            byChannel.set(k, (byChannel.get(k) ?? 0) + 1);
          }
          const channels = [...byChannel.entries()].sort((a, b) => b[1] - a[1]);
          const totalLeads = allDeals.length;
          const maxChannel = Math.max(...channels.map(([, n]) => n), 1);

          // ---- carros mais procurados (nº de leads por carro)
          const byCar = new Map<number, { label: string; brand: string; count: number }>();
          for (const d of allDeals) {
            const cur = byCar.get(d.vehicle_id) ?? { label: d.vehicle_label, brand: d.vehicle_brand, count: 0 };
            cur.count += 1;
            byCar.set(d.vehicle_id, cur);
          }
          const cars = [...byCar.values()].sort((a, b) => b.count - a.count).slice(0, 5);
          const maxCar = Math.max(...cars.map((c) => c.count), 1);

          // ---- destaques das vendas
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

          // ---- canal que mais vende (conversão real, não só lead)
          const salesByChannel = new Map<string, { n: number; revenue: number }>();
          for (const d of sold) {
            const k = d.channel?.trim() || "Sem canal";
            const cur = salesByChannel.get(k) ?? { n: 0, revenue: 0 };
            cur.n += 1;
            cur.revenue += d.sale_price ?? 0;
            salesByChannel.set(k, cur);
          }
          const rankedChannels = [...salesByChannel.entries()].sort(
            (a, b) => b[1].n - a[1].n || b[1].revenue - a[1].revenue
          );
          // um canal de verdade ganha do "Sem canal" quando houver
          const topChannel = rankedChannels.find(([k]) => k !== "Sem canal") ?? rankedChannels[0] ?? null;
          const topChannelLeads = topChannel ? (byChannel.get(topChannel[0]) ?? 0) : 0;

          return (
            <div className="space-y-5">
              <section className="rounded-2xl border border-zinc-200 bg-white">
                <h2 className="border-b border-zinc-100 px-4 py-3 text-[15px] font-semibold tracking-tight text-zinc-900">
                  Leads por canal
                </h2>
                {totalLeads === 0 ? (
                  <p className="px-4 py-6 text-[13px] text-zinc-500">Nenhum lead registrado ainda.</p>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {channels.map(([name, n]) => (
                      <div key={name} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="w-28 shrink-0 truncate text-[13px] font-medium text-zinc-800 sm:w-36">
                          {name}
                        </span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                          <span
                            className="block h-full rounded-full bg-violet-500"
                            style={{ width: `${(n / maxChannel) * 100}%` }}
                          />
                        </span>
                        <span className="w-8 shrink-0 text-right text-[13px] font-medium tabular-nums text-zinc-900">
                          {n}
                        </span>
                        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-zinc-500">
                          {Math.round((n / totalLeads) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white">
                <h2 className="border-b border-zinc-100 px-4 py-3 text-[15px] font-semibold tracking-tight text-zinc-900">
                  Carros mais procurados
                </h2>
                {cars.length === 0 ? (
                  <p className="px-4 py-6 text-[13px] text-zinc-500">Os carros aparecem aqui conforme os leads chegam.</p>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {cars.map((c) => (
                      <div key={c.label} className="flex items-center gap-3 px-4 py-2.5">
                        <BrandLogo brand={c.brand} size={16} />
                        <span className="w-32 shrink-0 truncate text-[13px] font-medium text-zinc-800 sm:w-44">
                          {c.label}
                        </span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                          <span
                            className="block h-full rounded-full bg-blue-600"
                            style={{ width: `${(c.count / maxCar) * 100}%` }}
                          />
                        </span>
                        <span className="w-14 shrink-0 text-right text-xs tabular-nums text-zinc-500">
                          {c.count} lead{c.count === 1 ? "" : "s"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {(biggest || bestMargin || fastest || topChannel) && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {/* só no desktop: canal que mais converte em venda */}
                  {topChannel && (
                    <div className="hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-card lg:block">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                        <Megaphone size={14} className="text-zinc-400" />
                        Canal que mais vende
                      </p>
                      <p className="mt-2 truncate text-[13px] font-semibold text-zinc-900">{topChannel[0]}</p>
                      <span className="mt-1 inline-block rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] text-zinc-500">
                        {topChannel[1].n} venda{topChannel[1].n === 1 ? "" : "s"}
                      </span>
                      <p className="mt-2.5 text-xl font-semibold tabular-nums tracking-tight text-emerald-600">
                        {brl(topChannel[1].revenue)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {topChannelLeads > 0
                          ? `Conversão: ${topChannel[1].n} de ${topChannelLeads} lead${topChannelLeads === 1 ? "" : "s"} (${Math.round((topChannel[1].n / topChannelLeads) * 100)}%)`
                          : "Faturamento das vendas do canal"}
                      </p>
                    </div>
                  )}
                  {biggest && (
                    <HighlightCard
                      icon={Trophy}
                      title="Maior faturamento"
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
                      sub={`Lucro de ${brl((bestMargin.sale_price ?? 0) - bestMargin.vehicle_total_cost)}`}
                    />
                  )}
                  {fastest && (
                    <HighlightCard
                      icon={Clock}
                      title="Saída mais rápida"
                      deal={fastest}
                      value={`${daysToSell(fastest)} dia(s)`}
                      sub={`Comprado em ${fmtDate(fastest.purchase_date)}, vendido em ${fmtDate(fastest.sold_date)}`}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })()
      ) : sold.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="Nenhuma venda registrada"
          description="Venda pelo botão verde “Venda” na tela de Veículos e o carro aparece aqui."
        />
      ) : (
        <>
          {/* celular: lista compacta (toque no > para detalhes) */}
          <div className="lg:hidden">
            <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              {sold.map((d) => (
                <SaleExpandRow key={d.id} deal={d} />
              ))}
            </div>
            <p className="mt-2 px-1 text-xs text-zinc-500">
              Total · {sold.length} venda(s) ·{" "}
              <span className="font-semibold tabular-nums text-zinc-900">{brl(totals.revenue)}</span>
            </p>
          </div>
          {/* desktop: tabela completa */}
          <div className="hidden lg:block">
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
          </div>
        </>
      )}
    </>
  );
}
