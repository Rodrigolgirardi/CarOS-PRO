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
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Stat, StatGrid } from "@/components/ui/stat";
import { brl, fmtDateShort, pct } from "@/lib/format";
import { DOT_CLASS, EVENT_META } from "@/lib/labels";
import { dashboardData } from "@/lib/queries/dashboard";

export const dynamic = "force-dynamic";

interface AttentionItem {
  icon: LucideIcon;
  text: string;
  sub?: string;
  href: string;
  urgent?: boolean;
}

export default function DashboardPage() {
  const data = dashboardData();
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
        attention.preparing === 1 ? "veículo aguardando preparação" : "veículos aguardando preparação"
      }`,
      href: "/veiculos?filtro=preparacao",
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

  const todayLabel = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)}
      />

      <section>
        <h2 className="mb-2.5 text-[13px] font-semibold text-zinc-900">Estoque</h2>
        <StatGrid className="grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Stat
            label="Veículos em estoque"
            value={stock.count}
            sub={stock.preparing > 0 ? `${stock.preparing} em preparação` : "—"}
          />
          <Stat label="Capital investido" value={brl(stock.invested)} sub="Compra + custos" />
          <Stat
            label="Valor de venda"
            value={brl(stock.saleValue)}
            sub={
              stock.pricedCount < stock.count
                ? `${stock.count - stock.pricedCount} sem preço definido`
                : "Todos com preço"
            }
          />
          <Stat
            label="Lucro potencial"
            value={brl(stock.potentialProfit)}
            valueClassName={stock.potentialProfit >= 0 ? "text-emerald-600" : "text-red-600"}
            sub={stock.saleValue > 0 ? `Margem ${pct(stock.potentialProfit / stock.saleValue)}` : "—"}
          />
          <Stat label="Dias em estoque" value={stock.avgDays != null ? `${stock.avgDays}` : "—"} sub="Média atual" />
        </StatGrid>
      </section>

      <section className="mt-7">
        <h2 className="mb-2.5 text-[13px] font-semibold text-zinc-900">Este mês</h2>
        <StatGrid className="grid-cols-2 md:grid-cols-4">
          <Stat label="Vendas" value={month.sales} sub={month.sales === 0 ? "Nenhuma venda ainda" : undefined} />
          <Stat label="Faturamento" value={brl(month.revenue)} />
          <Stat
            label="Lucro realizado"
            value={brl(month.profit)}
            valueClassName={month.profit >= 0 ? "text-emerald-600" : "text-red-600"}
          />
          <Stat label="Margem média" value={pct(month.margin)} />
        </StatGrid>
      </section>

      <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-2.5 text-[13px] font-semibold text-zinc-900">Requer sua atenção</h2>
          <div className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
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
                    {item.sub && <p className="truncate text-xs text-zinc-400">{item.sub}</p>}
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-zinc-300" />
                </Link>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-2.5 text-[13px] font-semibold text-zinc-900">Atividade recente</h2>
          <div className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {recent.length === 0 ? (
              <p className="px-4 py-6 text-[13px] text-zinc-400">
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
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                        <Badge tone={meta.tone} className="px-1.5 py-0 text-[10px]">
                          {meta.label}
                        </Badge>
                        <span className="truncate">
                          {[e.vehicle_label, e.customer_name].filter(Boolean).join(" · ") || "Geral"}
                        </span>
                      </p>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-zinc-400">{fmtDateShort(e.date)}</span>
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
        </section>
      </div>
    </>
  );
}
