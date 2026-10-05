import Link from "next/link";
import { Car, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { VehicleStatusBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkTabs } from "@/components/ui/tabs";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { AddExpenseButton } from "@/components/vehicles/add-expense-button";
import { AddIncomeButton } from "@/components/finance/add-income-button";
import { QuickSaleButton } from "@/components/vehicles/quick-sale-button";
import { customerOptions } from "@/lib/queries/customers";
import { sellerOptions } from "@/lib/queries/sellers";
import { VehiclePhoto } from "@/components/vehicles/vehicle-photo";
import { VehicleRowActions } from "@/components/vehicles/vehicle-row-actions";
import { brl, pct } from "@/lib/format";
import { vehicleMetrics, vehicleLabel } from "@/lib/metrics";
import { commissionRule, listCommissionRules } from "@/lib/queries/commissions";
import { listVehicles, vehicleCounts, vehicleOptions, type VehicleFilter } from "@/lib/queries/vehicles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Veículos" };

const TABS: { key: VehicleFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "anunciados", label: "Anunciados" }, // inclui reservados (estão no ar)
  { key: "nao_anunciados", label: "Não anunciados" },
  { key: "vendido", label: "Vendidos" },
];

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro } = await searchParams;
  // filtros sem aba, mas acessíveis por link (ex.: dashboard)
  const LINK_ONLY = ["parados", "preparacao", "reservado", "disponivel", "anunciado"];
  const valid = TABS.some((t) => t.key === filtro) || LINK_ONLY.includes(filtro ?? "");
  const filter = (valid ? filtro : "todos") as VehicleFilter;
  const rows = listVehicles(filter);
  const counts = vehicleCounts();
  const tabCount: Record<string, number> = {
    todos: counts.todos,
    anunciados: (counts.anunciado ?? 0) + (counts.reservado ?? 0),
    nao_anunciados: (counts.preparacao ?? 0) + (counts.disponivel ?? 0),
    vendido: counts.vendido ?? 0,
  };

  return (
    <>
      <PageHeader
        title="Veículos"
        description="Seu estoque, do jeito que ele está agora."
        actions={
          <div className="flex flex-col items-stretch gap-2">
            <LinkButton href="/compras/nova" variant="primary">
              <Plus size={14} />
              Adicionar veículo
            </LinkButton>
            <AddExpenseButton vehicles={vehicleOptions()} />
            <QuickSaleButton
              vehicles={vehicleOptions()}
              sellers={sellerOptions()}
              customers={customerOptions()}
              defaultCommission={commissionRule("venda_carro")}
            />
            <AddIncomeButton customers={customerOptions()} sellers={sellerOptions()} rules={listCommissionRules()} />
          </div>
        }
      />

      <LinkTabs
        className="mb-4"
        activeKey={filter === "parados" ? "" : filter}
        tabs={TABS.map((t) => ({
          key: t.key,
          label: t.label,
          count: tabCount[t.key] ?? 0,
          href: t.key === "todos" ? "/veiculos" : `/veiculos?filtro=${t.key}`,
        }))}
      />

      {(filter === "parados" || filter === "preparacao" || filter === "reservado") && (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          {filter === "parados"
            ? "Mostrando veículos parados há mais de 60 dias."
            : filter === "preparacao"
              ? "Mostrando veículos em preparação."
              : "Mostrando veículos reservados."}
          <Link href="/veiculos" className="underline underline-offset-2 hover:text-amber-900">
            Ver todos
          </Link>
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={Car}
          title={filter === "todos" ? "Nenhum veículo cadastrado" : "Nenhum veículo neste filtro"}
          description={
            filter === "todos"
              ? "Registre a primeira compra — o veículo entra no estoque automaticamente."
              : "Troque o filtro acima para ver outros veículos."
          }
          action={
            filter === "todos" ? (
              <LinkButton href="/compras/nova" variant="primary">
                <Plus size={14} />
                Registrar compra
              </LinkButton>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <THead>
            <Th>Veículo</Th>
            <Th>Ano</Th>
            <Th>Placa</Th>
            <Th right>KM</Th>
            <Th right>Compra</Th>
            <Th right>FIPE</Th>
            <Th right>Custo total</Th>
            <Th right>Venda</Th>
            <Th right>Lucro</Th>
            <Th right>Margem</Th>
            <Th right>Dias</Th>
            <Th>Status</Th>
            <Th />
          </THead>
          <TBody>
            {rows.map((v) => {
              const m = vehicleMetrics(v);
              const label = vehicleLabel(v);
              return (
                <Tr key={v.id}>
                  <Td className="max-w-[210px]">
                    <Link href={`/veiculos/${v.id}`} className="flex items-center gap-2.5">
                      <VehiclePhoto photo={v.photo} brand={v.brand} size="sm" />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate font-medium text-zinc-900 group-hover:underline group-hover:underline-offset-2">
                            {v.brand} {v.model}
                          </span>
                          {v.consignado === 1 && (
                            <span className="shrink-0 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                              Consignado
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-zinc-400">{v.version ?? "—"}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="text-zinc-500">
                    {v.year_fab
                      ? `${String(v.year_fab).slice(-2)}/${String(v.year_model ?? v.year_fab).slice(-2)}`
                      : "—"}
                  </Td>
                  <Td>
                    {v.plate ? (
                      <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[11px] text-zinc-600">
                        {v.plate}
                      </span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </Td>
                  <Td right className="text-zinc-500">
                    {v.km != null ? v.km.toLocaleString("pt-BR") : "—"}
                  </Td>
                  <Td right className="text-zinc-500">
                    {brl(v.purchase_price)}
                  </Td>
                  <Td right className="text-zinc-500">
                    {v.fipe_price != null ? brl(v.fipe_price) : <span className="text-zinc-300">—</span>}
                  </Td>
                  <Td right className="font-medium text-zinc-900">
                    {brl(v.total_cost)}
                  </Td>
                  <Td right className="text-zinc-900">
                    {brl(m.priceRef)}
                  </Td>
                  <Td right className={m.profit == null ? "text-zinc-300" : m.profit >= 0 ? "font-medium text-emerald-600" : "font-medium text-red-600"}>
                    {m.profit == null ? "—" : brl(m.profit)}
                  </Td>
                  <Td right className="text-zinc-500">
                    {pct(m.margin)}
                  </Td>
                  <Td right className={!m.sold && (m.days ?? 0) > 60 ? "font-medium text-amber-600" : "text-zinc-500"}>
                    {m.days ?? "—"}
                  </Td>
                  <Td>
                    <VehicleStatusBadge status={v.status} />
                  </Td>
                  <Td className="w-10">
                    <VehicleRowActions id={v.id} label={label} />
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      )}
    </>
  );
}
