import { Plus } from "lucide-react";
import { LeadSearch } from "@/components/deals/lead-search";
import { LinkButton } from "@/components/ui/button";
import { listConsignments } from "@/lib/queries/vehicles";
import { ConsignmentRowItem } from "./consignment-row";

// mesma grade da tabela de leads, para as duas abas terem o mesmo desenho
const GRID = "grid grid-cols-[1.4fr_1fr_0.9fr_1.6fr_0.9fr_16px] items-center gap-4";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Aba Consignantes no desktop: mesmo desenho da tabela de leads, uma linha por carro consignado. */
export async function ConsignmentsTable({ busca }: { busca?: string }) {
  const all = await listConsignments();
  const q = busca?.trim() ? norm(busca.trim()) : null;
  const qDigits = q ? q.replace(/\D/g, "") : "";
  const rows = q
    ? all.filter(
        (r) =>
          norm(r.owner).includes(q) ||
          norm(r.label).includes(q) ||
          (qDigits !== "" && (r.phone ?? "").replace(/\D/g, "").includes(qDigits))
      )
    : all;

  return (
    <div className="space-y-4 lg:mx-auto lg:max-w-5xl">
      <div className="flex items-center gap-2">
        <LinkButton href="/compras/nova?tipo=consignado" variant="primary">
          <Plus size={14} />
          Novo consignado
        </LinkButton>
        <div className="min-w-0 flex-1">
          <LeadSearch busca={busca ?? null} tab="consignantes" placeholder="Buscar por dono, telefone ou veículo…" />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 px-6 py-10 text-center text-[13px] text-zinc-500">
          {q ? "Nenhum consignado encontrado para essa busca." : "Nenhum carro consignado ainda."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className={`${GRID} border-b border-zinc-200 bg-zinc-50/60 px-4 py-2 text-xs font-medium text-zinc-500`}>
            <span>Nome do proprietário</span>
            <span>Contato</span>
            <span>Repasse combinado</span>
            <span>Veículo da pessoa</span>
            <span>Data/hora que deixou</span>
            <span />
          </div>
          <div className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <ConsignmentRowItem key={r.id} row={r} grid={GRID} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
