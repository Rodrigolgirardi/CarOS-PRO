import Link from "next/link";
import { KeyRound, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { VehicleStatusBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { VehiclePhoto } from "@/components/vehicles/vehicle-photo";
import { VehicleRowActions } from "@/components/vehicles/vehicle-row-actions";
import { brl } from "@/lib/format";
import { vehicleLabel } from "@/lib/metrics";
import { listVehicles } from "@/lib/queries/vehicles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Consignados" };

const daysAtStore = (createdAt: string): number =>
  Math.max(Math.round((Date.now() - Date.parse(createdAt)) / 86_400_000), 0);

export default function ConsignedPage() {
  const rows = listVehicles("consignados");

  return (
    <>
      <PageHeader
        title="Consignados"
        description="Carros de terceiros na sua loja — sem compra e sem dinheiro saindo do caixa."
        actions={
          <LinkButton href="/compras/nova?tipo=consignado" variant="primary">
            <Plus size={14} />
            Adicionar consignado
          </LinkButton>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="Nenhum consignado na loja"
          description="Registre um carro de terceiro: ele entra aqui, e o repasse ao dono só vira custo quando vender."
          action={
            <LinkButton href="/compras/nova?tipo=consignado" variant="primary">
              <Plus size={14} />
              Adicionar consignado
            </LinkButton>
          }
        />
      ) : (
        <Table>
          <THead>
            <Th>Veículo</Th>
            <Th>Placa</Th>
            <Th>Dono</Th>
            <Th right>Repasse</Th>
            <Th right>Venda</Th>
            <Th right>Comissão prevista</Th>
            <Th right>Dias na loja</Th>
            <Th>Status</Th>
            <Th />
          </THead>
          <TBody>
            {rows.map((v) => {
              const commission =
                v.sale_price != null ? v.sale_price - (v.consignor_value ?? 0) - v.costs_total : null;
              return (
                <Tr key={v.id}>
                  <Td className="max-w-[220px]">
                    <Link href={`/veiculos/${v.id}`} className="flex items-center gap-2.5">
                      <VehiclePhoto photo={v.photo} brand={v.brand} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-zinc-900">
                          {v.brand} {v.model}
                        </span>
                        <span className="block truncate text-xs text-zinc-400">{v.version ?? "—"}</span>
                      </span>
                    </Link>
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
                  <Td className="max-w-[180px] truncate text-zinc-600">{v.consignor ?? "—"}</Td>
                  <Td right className="tabular-nums text-zinc-600">
                    {v.consignor_value != null ? brl(v.consignor_value) : <span className="text-zinc-300">—</span>}
                  </Td>
                  <Td right className="tabular-nums text-zinc-900">
                    {v.sale_price != null ? brl(v.sale_price) : <span className="text-zinc-300">—</span>}
                  </Td>
                  <Td
                    right
                    className={`font-medium tabular-nums ${
                      commission == null ? "text-zinc-300" : commission >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {commission == null ? "—" : brl(commission)}
                  </Td>
                  <Td right className="tabular-nums text-zinc-500">
                    {daysAtStore(v.created_at)}
                  </Td>
                  <Td>
                    <VehicleStatusBadge status={v.status} />
                  </Td>
                  <Td className="w-10">
                    <VehicleRowActions id={v.id} label={vehicleLabel(v)} />
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
