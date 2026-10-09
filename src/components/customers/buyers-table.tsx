import { LeadSearch } from "@/components/deals/lead-search";
import { QuickSaleButton } from "@/components/vehicles/quick-sale-button";
import { commissionRule } from "@/lib/queries/commissions";
import { customerOptions } from "@/lib/queries/customers";
import { sellerOptions } from "@/lib/queries/sellers";
import { vehicleOptions } from "@/lib/queries/vehicles";
import type { DealRow } from "@/lib/types";
import { BuyerRowItem } from "./buyer-row";

// mesma grade das tabelas de leads e consignantes
const GRID = "grid grid-cols-[1.4fr_1fr_0.9fr_1.6fr_0.9fr_16px] items-center gap-4";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Aba Compradores no desktop: uma linha por venda, no mesmo desenho de Leads e Consignantes. */
export async function BuyersTable({ deals, busca }: { deals: DealRow[]; busca?: string }) {
  const [vehicles, sellers, customers, saleCommission] = await Promise.all([
    vehicleOptions(),
    sellerOptions(),
    customerOptions(),
    commissionRule("venda_carro"),
  ]);

  // vendas com comprador identificado (o genérico "Venda balcão" não é um comprador)
  const sales = deals
    .filter((d) => (d.stage === "vendido" || d.stage === "entregue") && d.customer_name !== "Venda balcão")
    .sort((a, b) => ((a.sold_date ?? a.created_at) < (b.sold_date ?? b.created_at) ? 1 : -1));
  const q = busca?.trim() ? norm(busca.trim()) : null;
  const qDigits = q ? q.replace(/\D/g, "") : "";
  const rows = q
    ? sales.filter(
        (d) =>
          norm(d.customer_name).includes(q) ||
          norm(d.vehicle_label).includes(q) ||
          (qDigits !== "" && (d.customer_phone ?? "").replace(/\D/g, "").includes(qDigits))
      )
    : sales;

  return (
    <div className="space-y-4 lg:mx-auto lg:max-w-5xl">
      <div className="flex items-center gap-2">
        <QuickSaleButton vehicles={vehicles} sellers={sellers} customers={customers} defaultCommission={saleCommission} />
        <div className="min-w-0 flex-1">
          <LeadSearch busca={busca ?? null} tab="compradores" placeholder="Buscar por comprador, telefone ou veículo…" />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 px-6 py-10 text-center text-[13px] text-zinc-500">
          {q ? "Nenhum comprador encontrado para essa busca." : "Nenhuma venda com comprador registrada ainda."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className={`${GRID} border-b border-zinc-200 bg-zinc-50/60 px-4 py-2 text-xs font-medium text-zinc-500`}>
            <span>Nome do comprador</span>
            <span>Contato</span>
            <span>Valor de venda</span>
            <span>Veículo vendido</span>
            <span>Data/hora da venda</span>
            <span />
          </div>
          <div className="divide-y divide-zinc-100">
            {rows.map((d) => (
              <BuyerRowItem key={d.id} deal={d} grid={GRID} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
