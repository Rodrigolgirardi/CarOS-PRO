import { LeadExpandRow } from "@/components/deals/lead-expand-row";
import { LeadSearch } from "@/components/deals/lead-search";
import { NewDealButton } from "@/components/deals/new-deal-button";
import { customerOptions } from "@/lib/queries/customers";
import { docsForCustomer } from "@/lib/queries/documents";
import { vehicleOptions } from "@/lib/queries/vehicles";
import type { DealRow, DocRow } from "@/lib/types";

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export async function LeadsPanel({ deals, status, busca }: { deals: DealRow[]; status?: string; busca?: string }) {
  const total = deals.length;
  const atendimento = deals.filter((d) => d.stage === "interessado").length;
  const negociacao = deals.filter((d) => d.stage === "proposta" || d.stage === "reservado").length;
  const convertidos = deals.filter((d) => d.stage === "vendido" || d.stage === "entregue").length;
  const perdidos = deals.filter((d) => d.stage === "perdido").length;

  const filter = ["atendimento", "negociacao", "convertidos", "perdidos"].includes(status ?? "") ? status! : "todos";
  const byStatus = deals.filter((d) => {
    if (filter === "atendimento") return d.stage === "interessado";
    if (filter === "negociacao") return d.stage === "proposta" || d.stage === "reservado";
    if (filter === "convertidos") return d.stage === "vendido" || d.stage === "entregue";
    if (filter === "perdidos") return d.stage === "perdido";
    return true;
  });
  const q = busca?.trim() ? norm(busca.trim()) : null;
  const rows = q
    ? byStatus.filter(
        (d) =>
          norm(d.customer_name).includes(q) ||
          (d.customer_phone ?? "").replace(/\D/g, "").includes(q.replace(/\D/g, "") || "§") ||
          norm(d.vehicle_label).includes(q)
      )
    : byStatus;

  const href = (st?: string) => `/vendas?tab=leads${st ? `&status=${st}` : ""}`;

  // documentos de cada cliente (para a ficha dentro do lápis)
  const docsByCustomer = new Map<number, DocRow[]>();
  for (const id of new Set(rows.map((d) => d.customer_id))) {
    docsByCustomer.set(id, await docsForCustomer(id));
  }

  return (
    <div className="space-y-4 lg:max-w-3xl">
      <div className="flex items-center gap-2">
        <NewDealButton vehicles={await vehicleOptions()} customers={await customerOptions()} label="Novo lead" />
        <div className="min-w-0 flex-1">
          <LeadSearch busca={busca ?? null} />
        </div>
      </div>

      {/* lista de leads */}
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 px-6 py-10 text-center text-[13px] text-zinc-500">
          {q ? "Nenhum lead encontrado para essa busca." : "Nenhum lead neste filtro — registre um pelo botão Novo lead."}
        </p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((d) => (
            <LeadExpandRow key={d.id} deal={d} docs={docsByCustomer.get(d.customer_id) ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}
