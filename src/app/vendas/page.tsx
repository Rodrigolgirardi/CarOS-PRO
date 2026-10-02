import { Handshake } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DealCard } from "@/components/deals/deal-card";
import { NewDealButton } from "@/components/deals/new-deal-button";
import { DealStageBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { brl } from "@/lib/format";
import { DEAL_STAGE } from "@/lib/labels";
import { customerOptions } from "@/lib/queries/customers";
import { listDeals } from "@/lib/queries/deals";
import { vehicleOptions } from "@/lib/queries/vehicles";
import type { DealStage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendas" };

const PIPELINE: DealStage[] = ["interessado", "proposta", "reservado", "vendido", "entregue"];

export default function SalesPage() {
  const deals = listDeals();
  const customers = customerOptions();
  const vehicles = vehicleOptions(); // só não vendidos

  const byStage = (stage: DealStage) => deals.filter((d) => d.stage === stage);
  const lost = byStage("perdido");
  const activeCount = deals.length - lost.length;

  return (
    <>
      <PageHeader
        title="Vendas"
        description="Interessado → Proposta → Reservado → Vendido → Entregue."
        actions={<NewDealButton vehicles={vehicles} customers={customers} />}
      />

      {activeCount === 0 && lost.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="Nenhuma negociação ainda"
          description="Registre um interessado ou uma proposta para começar o funil de vendas."
          action={<NewDealButton vehicles={vehicles} customers={customers} label="Criar negociação" />}
        />
      ) : (
        <>
          <div className="grid grid-cols-5 gap-3 max-lg:grid-cols-2 max-md:grid-cols-1">
            {PIPELINE.map((stage) => {
              const items = byStage(stage);
              return (
                <div key={stage} className="min-w-0 rounded-xl bg-zinc-50/80 p-2.5">
                  <div className="mb-2.5 flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-zinc-700">{DEAL_STAGE[stage].label}</span>
                    <span className="text-xs tabular-nums text-zinc-400">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-zinc-200 py-6 text-center text-[11px] text-zinc-300">
                        vazio
                      </div>
                    ) : (
                      items.map((d) => <DealCard key={d.id} deal={d} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {lost.length > 0 && (
            <details className="mt-6 rounded-xl border border-zinc-200 bg-white open:pb-2">
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
      )}
    </>
  );
}
