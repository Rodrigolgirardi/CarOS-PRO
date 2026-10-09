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
import { Badge } from "@/components/ui/badge";
import { brl, fmtDateShort } from "@/lib/format";
import { DOT_CLASS, EVENT_META } from "@/lib/labels";
import type { DashboardData } from "@/lib/queries/dashboard";

export interface AttentionItem {
  icon: LucideIcon;
  text: string;
  sub?: string;
  href: string;
  urgent?: boolean;
}

/** Monta a lista de pendências a partir dos números de atenção do dashboard. */
export function buildAttentionItems(attention: DashboardData["attention"]): AttentionItem[] {
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
  return items;
}

/**
 * Blocos "Requer sua atenção" + "Atividade recente", compartilhados entre o
 * layout de celular e o de desktop. O pai fornece o grid em volta; aqui vão
 * só os dois <details> (o primeiro aberto por padrão).
 */
export function AttentionActivity({
  items,
  recent,
}: {
  items: AttentionItem[];
  recent: DashboardData["recent"];
}) {
  return (
    <>
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
    </>
  );
}
