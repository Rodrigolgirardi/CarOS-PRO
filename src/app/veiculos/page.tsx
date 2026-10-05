import Link from "next/link";
import { Car, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { VehicleStatusBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkTabs } from "@/components/ui/tabs";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { AddExpenseButton } from "@/components/vehicles/add-expense-button";
import { QuickSaleButton } from "@/components/vehicles/quick-sale-button";
import { customerOptions } from "@/lib/queries/customers";
import { sellerOptions } from "@/lib/queries/sellers";
import { VehiclePhoto } from "@/components/vehicles/vehicle-photo";
import { VehicleRowActions } from "@/components/vehicles/vehicle-row-actions";
import { brl, fmtKm, pct } from "@/lib/format";
import { vehicleMetrics, vehicleLabel } from "@/lib/metrics";
import { listVehicles, vehicleCounts, vehicleOptions, type VehicleFilter } from "@/lib/queries/vehicles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Veículos" };

const TABS: { key: VehicleFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "disponivel", label: "Disponíveis" },
  { key: "anunciado", label: "Anunciados" },
  { key: "vendido", label: "Vendidos" },
];

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro } = await searchParams;
  // "preparacao" e "reservado" não têm aba, mas seguem acessíveis por link (ex.: dashboard)
  const valid =
    TABS.some((t) => t.key === filtro) || filtro === "parados" || filtro === "preparacao" || filtro === "reservado";
  const filter = (valid ? filtro : "todos") as VehicleFilter;
  const rows = listVehicles(filter);
  const counts = vehicleCounts();

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
            <QuickSaleButton vehicles={vehicleOptions()} sellers={sellerOptions()} customers={customerOptions()} />
          </div>
        }
      />

      <LinkTabs
        className="mb-4"
        activeKey={filter === "parados" ? "" : filter}
        tabs={TABS.map((t) => ({
          key: t.key,
          label: t.label,
          count: t.key === "todos" ? counts.todos : (counts[t.key] ?? 0),
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
            <Th>Chassi</Th>
            <Th right>KM</Th>
            <Th right>Compra</Th>
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
                  <Td className="max-w-[260px]">
                    <Link href={`/veiculos/${v.id}`} className="flex items-center gap-2.5">
                      <VehiclePhoto photo={v.photo} brand={v.brand} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-zinc-900 group-hover:underline group-hover:underline-offset-2">
                          {v.brand} {v.model}
                        </span>
                        <span className="block truncate text-xs text-zinc-400">{v.version ?? "—"}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="text-zinc-500">
                    {v.year_fab ? `${v.year_fab}/${v.year_model ?? v.year_fab}` : "—"}
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
                  <Td>
                    {v.chassis ? (
                      <span className="font-mono text-[11px] text-zinc-500">{v.chassis}</span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </Td>
                  <Td right className="text-zinc-500">
                    {fmtKm(v.km)}
                  </Td>
                  <Td right className="text-zinc-500">
                    {brl(v.purchase_price)}
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
