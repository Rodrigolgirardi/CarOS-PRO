import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  ArrowDownToLine,
  ArrowRight,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileWarning,
  Layers,
  Percent,
  Receipt,
  RefreshCw,
  TrendingUp,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { MonthPick } from "@/components/dashboard/dashboard-filters";
import { DesktopDashboard } from "@/components/dashboard/desktop-dashboard";
import { MonthlySalesChart } from "@/components/dashboard/monthly-chart";
import { VehiclePhoto } from "@/components/vehicles/vehicle-photo";
import { Badge } from "@/components/ui/badge";
import { brl, fmtDateShort, fmtKm, pct } from "@/lib/format";
import { DOT_CLASS, EVENT_META, VEHICLE_STATUS } from "@/lib/labels";
import { dashboardData } from "@/lib/queries/dashboard";

export const dynamic = "force-dynamic";

interface AttentionItem {
  icon: LucideIcon;
  text: string;
  sub?: string;
  href: string;
  urgent?: boolean;
}

/** KPI compacto: rótulo + ícone suave, número grande, contexto. */
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
  valueClass,
}: {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  iconClass: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-4">
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-[11px] font-medium leading-snug text-zinc-500 sm:text-xs">{label}</p>
        <span className={`grid size-6 shrink-0 place-items-center rounded-lg sm:size-7 ${iconClass}`}>
          <Icon size={14} strokeWidth={1.75} />
        </span>
      </div>
      <p
        className={`mt-1 truncate text-[13px] font-semibold tracking-tight tabular-nums sm:text-xl ${
          valueClass ?? "text-zinc-900"
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-zinc-500">{sub}</p>
    </div>
  );
}

/** Indicador do resumo do mês (dentro de um card único). */
function MonthStat({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
  valueClass,
}: {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  iconClass: string;
  valueClass?: string;
}) {
  return (
    <div className="min-w-0 p-2.5 sm:p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 sm:text-xs">
        <Icon size={13} className={`shrink-0 ${iconClass}`} />
        <span className="truncate">{label}</span>
      </p>
      <p
        className={`mt-1 truncate text-[13px] font-semibold tracking-tight tabular-nums sm:text-lg ${
          valueClass ?? "text-zinc-900"
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-zinc-500">{sub}</p>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const sp = await searchParams;
  const now0 = new Date();
  const currentYear = now0.getFullYear();
  const years = Array.from({ length: Math.max(1, currentYear - 2026 + 1) }, (_, i) => 2026 + i);
  const mesValido = !!sp.mes && /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.mes) && years.includes(Number(sp.mes.slice(0, 4)));
  const mesKey = mesValido ? sp.mes! : `${currentYear}-${String(now0.getMonth() + 1).padStart(2, "0")}`;
  const ano = Number(mesKey.slice(0, 4));
  const data = await dashboardData({ year: ano, monthKey: mesKey });
  const { stock, month, attention, recent } = data;
  const monthNet = month.revenue - month.spend;
  const monthMargin = month.revenue > 0 ? monthNet / month.revenue : null;
  const totalPurchases = stock.vehicles.reduce((s, v) => s + v.purchase, 0);

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
      text: `${attention.preparing} ${attention.preparing === 1 ? "veículo para arrumar" : "veículos para arrumar"}`,
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
      {/* celular/tablet: layout novo */}
      <div className="space-y-5 lg:hidden">
      {/* ------------------------------------------------ KPIs principais */}
      <section className="grid grid-cols-4 gap-2 sm:gap-3">
        <KpiCard
          label="Estoque total"
          value={brl(stock.invested)}
          sub={`${stock.count} ${stock.count === 1 ? "veículo" : "veículos"}`}
          icon={Layers}
          iconClass="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label="Capital investido"
          value={brl(totalPurchases)}
          sub="Total de compras"
          icon={Wallet}
          iconClass="bg-zinc-100 text-zinc-600"
        />
        <KpiCard
          label="Lucro estimado"
          value={brl(stock.potentialProfit)}
          sub="Potencial de venda"
          icon={TrendingUp}
          iconClass="bg-emerald-50 text-emerald-600"
          valueClass={stock.potentialProfit >= 0 ? "text-emerald-600" : "text-red-600"}
        />
        <KpiCard
          label="Giro do estoque"
          value={stock.avgDays != null ? `${stock.avgDays} ${stock.avgDays === 1 ? "dia" : "dias"}` : "—"}
          sub="Tempo médio"
          icon={RefreshCw}
          iconClass="bg-violet-50 text-violet-600"
        />
      </section>

      {/* ------------------------------------------------ resultado mensal */}
      <MonthlySalesChart months={data.monthly} action={<MonthPick years={years} active={mesKey} />} />

      {/* ------------------------------------------------ resumo do mês (sem título: segue o filtro lá de cima) */}
      <section className="rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="grid grid-cols-4 divide-x divide-zinc-100">
          <MonthStat
            label="Faturamento"
            value={brl(month.revenue)}
            sub={month.sales === 0 ? "Nenhuma venda" : `${month.sales} venda(s)`}
            icon={BarChart3}
            iconClass="text-blue-500"
          />
          <MonthStat
            label="Custos"
            value={brl(month.spend)}
            sub="Compras + custos + contas"
            icon={Receipt}
            iconClass="text-red-500"
            valueClass="text-red-600"
          />
          <MonthStat
            label="Lucro"
            value={brl(monthNet)}
            sub="Faturamento − gastos"
            icon={TrendingUp}
            iconClass="text-emerald-500"
            valueClass={monthNet >= 0 ? "text-emerald-600" : "text-red-600"}
          />
          <MonthStat
            label="Margem"
            value={monthMargin != null ? pct(monthMargin) : "0%"}
            sub="Sobre faturamento"
            icon={Percent}
            iconClass="text-violet-500"
          />
        </div>
      </section>

      {/* ------------------------------------------------ estoque */}
      <section className="rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-zinc-900">Estoque</h2>
          <Link
            href="/veiculos"
            className="flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            Ver todos
            <ArrowRight size={12} />
          </Link>
        </div>

        {stock.vehicles.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-zinc-500">
            Nenhum veículo em estoque — registre a próxima compra para repor.
          </p>
        ) : (
          <div className="space-y-3 p-4">
            {/* cards de veículo */}
            <div className="space-y-2">
              {stock.vehicles.map((v) => {
                const statusMeta = VEHICLE_STATUS[v.status];
                const specs = [v.yearLabel, v.version, v.transmission].filter(Boolean).join(" · ");
                return (
                  <Link
                    key={v.id}
                    href={`/veiculos/${v.id}`}
                    className="flex items-stretch gap-2.5 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-2.5 transition-colors hover:border-zinc-200 hover:bg-zinc-50 sm:gap-4 sm:p-3"
                  >
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 min-[480px]:flex-row min-[480px]:items-center">
                      <span className="flex min-w-0 items-center gap-3">
                        <VehiclePhoto photo={v.photo} brand={v.brand} size="md" />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-zinc-900">{v.label}</span>
                            {v.status !== "cadastrado" ? (
                              <Badge tone={statusMeta.tone} className="shrink-0 px-1.5 py-0 text-[11px]">
                                {statusMeta.label}
                              </Badge>
                            ) : (
                              <span
                                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                                  v.consigned ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {v.consigned ? "Consignado" : "Próprio"}
                              </span>
                            )}
                          </span>
                          {specs && <span className="mt-0.5 block truncate text-xs text-zinc-500">{specs}</span>}
                          <span className="mt-0.5 flex items-center gap-2.5 text-[11px] text-zinc-500">
                            {v.days != null && (
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {v.days} dias no estoque
                              </span>
                            )}
                            {v.km != null && <span>{fmtKm(v.km)}</span>}
                          </span>
                        </span>
                      </span>

                      <span className="shrink-0 space-y-0.5 border-zinc-100 text-[12px] max-[479px]:border-t max-[479px]:pt-1.5 min-[480px]:w-52 min-[480px]:border-l min-[480px]:pl-4">
                        <span className="flex items-center justify-between gap-3">
                          <span className="text-zinc-500">Custo total</span>
                          <span className="font-medium tabular-nums text-zinc-700">
                            {brl(v.sale != null && v.profit != null ? v.sale - v.profit : v.invested)}
                          </span>
                        </span>
                        <span className="flex items-center justify-between gap-3">
                          <span className="text-zinc-500">Preço de venda</span>
                          <span className="font-medium tabular-nums text-zinc-900">
                            {v.sale != null ? brl(v.sale) : "—"}
                          </span>
                        </span>
                        <span
                          className={`flex items-center justify-between gap-3 rounded-md px-1.5 py-0.5 ${
                            v.profit == null ? "bg-zinc-100/60" : v.profit >= 0 ? "bg-emerald-50" : "bg-red-50"
                          }`}
                        >
                          <span
                            className={
                              v.profit == null ? "text-zinc-500" : v.profit >= 0 ? "text-emerald-700" : "text-red-600"
                            }
                          >
                            Lucro estimado
                          </span>
                          <span
                            className={`font-semibold tabular-nums ${
                              v.profit == null ? "text-zinc-500" : v.profit >= 0 ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {v.profit != null ? brl(v.profit) : "—"}
                          </span>
                        </span>
                      </span>
                    </div>
                    <ChevronRight size={15} className="hidden shrink-0 self-center text-zinc-300 min-[480px]:block" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------ atenção + atividade */}
      <div className="grid grid-cols-2 items-start gap-3 sm:gap-6">
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
          <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
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
          <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
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
      </div>

      {/* desktop: layout clássico */}
      <div className="hidden lg:block">
        <DesktopDashboard data={data} />
      </div>
    </>
  );
}
