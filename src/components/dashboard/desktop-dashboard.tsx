import Link from "next/link";
import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileWarning,
  Receipt,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { MonthlySalesChart } from "@/components/dashboard/monthly-chart";
import { BrandLogo } from "@/components/vehicles/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Stat, StatGrid } from "@/components/ui/stat";
import { brl, fmtDateShort, pct } from "@/lib/format";
import { DOT_CLASS, EVENT_META } from "@/lib/labels";
import type { DashboardData } from "@/lib/queries/dashboard";

interface AttentionItem {
  icon: LucideIcon;
  text: string;
  sub?: string;
  href: string;
  urgent?: boolean;
}

// Rampa azul tom sobre tom para o gráfico de estoque: os carros já vêm
// ordenados por valor (desc), então o maior fica com o tom mais escuro.
const STOCK_SHADES = ["bg-blue-900", "bg-blue-800", "bg-blue-700", "bg-blue-600", "bg-blue-500", "bg-blue-400", "bg-blue-300"];
const stockShade = (i: number) => STOCK_SHADES[Math.min(i, STOCK_SHADES.length - 1)];

/** Layout clássico do dashboard — usado apenas no desktop (lg+). */
export function DesktopDashboard({ data }: { data: DashboardData }) {
  const { stock, month, attention, recent } = data;

  const items: AttentionItem[] = [];
  if (attention.stale > 0)
    items.push({
      icon: Clock,
      text: `${attention.stale} ${attention.stale === 1 ? "veículo parado" : "veículos parados"} há mais de 60 dias`,
      sub: "Considere revisar o preço ou reforçar o anúncio",
      href: "/veiculos?filtro=parados",
    });
  if (attention.docsPendingVehicles > 0)
    items.push({
      icon: FileWarning,
      text: `${attention.docsPendingVehicles} ${
        attention.docsPendingVehicles === 1 ? "veículo com documentação pendente" : "veículos com documentação pendente"
      }`,
      href: "/operacoes?grupo=documentacao",
    });
  if (attention.preparing > 0)
    items.push({
      icon: Wrench,
      text: `${attention.preparing} ${
        attention.preparing === 1 ? "veículo para arrumar" : "veículos para arrumar"
      }`,
      href: "/veiculos?filtro=para_arrumar",
    });
  if (attention.payablesOpen > 0)
    items.push({
      icon: Receipt,
      text: `${brl(attention.payablesOpen)} em contas a pagar`,
      sub: attention.payablesOverdue > 0 ? `${attention.payablesOverdue} vencida(s)` : undefined,
      href: "/financeiro?tab=pagar",
      urgent: attention.payablesOverdue > 0,
    });
  if (attention.receivablesPending > 0)
    items.push({
      icon: ArrowDownToLine,
      text: `${attention.receivablesPending} ${
        attention.receivablesPending === 1 ? "venda aguardando recebimento" : "vendas aguardando recebimento"
      }`,
      sub: `${brl(attention.receivablesPendingTotal)} a receber`,
      href: "/financeiro?tab=receber",
    });

  return (
    <>
      <section>
        <h2 className="mb-2.5 text-[13px] font-semibold text-zinc-900">Vendas</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
          <MonthlySalesChart months={data.monthly} />
          <StatGrid className="grid-cols-2 lg:grid-cols-1 lg:grid-rows-3">
            <Stat
              label="Faturamento"
              value={brl(month.revenue)}
              sub={month.sales === 0 ? "Nenhuma venda no mês" : `${month.sales} venda(s) no mês`}
            />
            <Stat
              label="Gastos"
              value={brl(month.spend)}
              valueClassName="text-red-600"
              sub="Compras + custos + contas"
            />
            <Stat
              label="Geração de caixa"
              value={brl(month.revenue - month.spend)}
              valueClassName={month.revenue - month.spend >= 0 ? "text-emerald-600" : "text-red-600"}
              sub="Faturamento − gastos"
            />
          </StatGrid>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="mb-2.5 text-[13px] font-semibold text-zinc-900">Estoque</h2>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
            <p className="text-[13px] font-semibold text-zinc-900">
              {stock.count} {stock.count === 1 ? "veículo" : "veículos"} em estoque ·{" "}
              <span className="tabular-nums">{brl(stock.invested)}</span>
            </p>
            <p className="text-xs text-zinc-500">
              {stock.preparing > 0 ? `${stock.preparing} para arrumar` : ""}
            </p>
          </div>
          {stock.vehicles.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-zinc-500">Nenhum veículo em estoque.</p>
          ) : (
            <>
              {/* distribuição do valor do estoque: uma fatia por carro, tom sobre tom (mais escuro = maior valor) */}
              {stock.invested > 0 && (
                <div className="border-b border-zinc-100 px-4 py-3">
                  <div className="flex h-2.5 items-stretch gap-[2px]">
                    {stock.vehicles.map((v, i) => (
                      <div
                        key={v.id}
                        className={`min-w-[3px] rounded-[2px] first:rounded-l-full last:rounded-r-full ${stockShade(i)}`}
                        style={{ width: `${(v.invested / stock.invested) * 100}%` }}
                        title={`${v.label} — ${brl(v.invested)} (${pct(v.invested / stock.invested, 0)} do estoque)`}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-zinc-500">
                    Cada fatia é um carro, na ordem da lista — tom mais escuro, maior valor.
                  </p>
                </div>
              )}
              <div className="divide-y divide-zinc-100">
                {stock.vehicles.map((v, i) => {
                  const share = stock.invested > 0 ? v.invested / stock.invested : 0;
                  return (
                    <Link
                      key={v.id}
                      href={`/veiculos/${v.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-50"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <BrandLogo brand={v.label} size={18} />
                        <span className="truncate text-[13px] font-medium text-zinc-800">{v.label}</span>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                            v.consigned ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {v.consigned ? "Consignado" : "Próprio"}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2.5">
                        <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100 sm:block">
                          <span
                            className={`block h-full rounded-full ${stockShade(i)}`}
                            style={{ width: `${share * 100}%` }}
                          />
                        </span>
                        <span className="w-10 text-right text-xs tabular-nums text-zinc-500">{pct(share, 0)}</span>
                        <span className="w-24 text-right text-[13px] tabular-nums text-zinc-600">{brl(v.invested)}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50/60 px-4 py-2.5">
                <span className="text-[13px] font-semibold text-zinc-900">Custo total (compra + custos)</span>
                <span className="text-[13px] font-semibold tabular-nums text-zinc-900">{brl(stock.invested)}</span>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <details className="group" open>
          <summary className="mb-2.5 flex cursor-pointer list-none items-center gap-1.5 text-[13px] font-semibold text-zinc-900 [&::-webkit-details-marker]:hidden">
            <ChevronRight size={14} className="text-zinc-400 transition-transform group-open:rotate-90" />
            Requer sua atenção
            {items.length > 0 && (
              <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-zinc-500">
                {items.length}
              </span>
            )}
          </summary>
          <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
            {items.length === 0 ? (
              <div className="flex items-center gap-3 px-4 py-6 text-[13px] text-zinc-500">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Tudo em dia — nada pendente por aqui.
              </div>
            ) : (
              items.map((item) => (
                <Link
                  key={item.text}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-50"
                >
                  <div
                    className={`grid size-7 shrink-0 place-items-center rounded-full ${
                      item.urgent ? "bg-red-50 text-red-500" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {item.urgent ? <AlertCircle size={14} /> : <item.icon size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-zinc-800">{item.text}</p>
                    {item.sub && <p className="truncate text-xs text-zinc-500">{item.sub}</p>}
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-zinc-300" />
                </Link>
              ))
            )}
          </div>
        </details>

        <details className="group">
          <summary className="mb-2.5 flex cursor-pointer list-none items-center gap-1.5 text-[13px] font-semibold text-zinc-900 [&::-webkit-details-marker]:hidden">
            <ChevronRight size={14} className="text-zinc-400 transition-transform group-open:rotate-90" />
            Atividade recente
            {recent.length > 0 && (
              <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-zinc-500">
                {recent.length}
              </span>
            )}
          </summary>
          <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
            {recent.length === 0 ? (
              <p className="px-4 py-6 text-[13px] text-zinc-500">
                A linha do tempo aparece aqui conforme você registra compras, custos e vendas.
              </p>
            ) : (
              recent.map((e) => {
                const meta = EVENT_META[e.type] ?? EVENT_META.outro;
                const inner = (
                  <>
                    <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${DOT_CLASS[meta.tone]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-zinc-800">{e.description}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                        <Badge tone={meta.tone} className="px-1.5 py-0 text-[11px]">
                          {meta.label}
                        </Badge>
                        <span className="truncate">
                          {[e.vehicle_label, e.customer_name].filter(Boolean).join(" · ") || "Geral"}
                        </span>
                      </p>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-zinc-500">{fmtDateShort(e.date)}</span>
                  </>
                );
                const cls = "flex items-start gap-2.5 px-4 py-2.5";
                return e.vehicle_id ? (
                  <Link key={e.id} href={`/veiculos/${e.vehicle_id}?tab=historico`} className={`${cls} transition-colors hover:bg-zinc-50`}>
                    {inner}
                  </Link>
                ) : e.customer_id ? (
                  <Link key={e.id} href={`/clientes/${e.customer_id}`} className={`${cls} transition-colors hover:bg-zinc-50`}>
                    {inner}
                  </Link>
                ) : (
                  <div key={e.id} className={cls}>
                    {inner}
                  </div>
                );
              })
            )}
          </div>
        </details>
      </div>
    </>
  );
}
