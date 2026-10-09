import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SimulatorButton } from "@/components/purchases/simulator-button";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat, StatGrid } from "@/components/ui/stat";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { VehiclePhoto } from "@/components/vehicles/vehicle-photo";
import { brl, fmtDate } from "@/lib/format";
import { purchasesReport } from "@/lib/queries/reports";

export const dynamic = "force-dynamic";
export const metadata = { title: "Compras" };

export default async function PurchasesPage() {
  const report = await purchasesReport("tudo");

  return (
    <>
      <PageHeader
        title="Compras"
        description="Cada compra cria o veículo no estoque com o checklist de preparação."
        actions={
          <>
            <SimulatorButton />
            <LinkButton href="/compras/nova" variant="primary">
              <Plus size={14} />
              Nova compra
            </LinkButton>
          </>
        }
      />

      <StatGrid className="mb-5 grid-cols-1 sm:grid-cols-3">
        <Stat label="Veículos comprados" value={report.count} />
        <Stat label="Total em compras" value={brl(report.totalPurchase)} />
        <Stat label="Custo total médio" value={brl(report.avgCost)} sub="Compra + custos por veículo" />
      </StatGrid>

      {report.rows.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Nenhuma compra registrada"
          description="Registre a primeira compra para montar seu estoque."
          action={
            <LinkButton href="/compras/nova" variant="primary">
              <Plus size={14} />
              Nova compra
            </LinkButton>
          }
        />
      ) : (
        <Table>
          <THead>
            <Th>Data</Th>
            <Th>Veículo</Th>
            <Th>Vendedor</Th>
            <Th>Pagamento</Th>
            <Th right>Preço de compra</Th>
            <Th right>Custos</Th>
            <Th right>Custo total</Th>
          </THead>
          <TBody>
            {report.rows.map((v) => (
              <Tr key={v.id}>
                <Td className="text-zinc-500">{fmtDate(v.purchase_date)}</Td>
                <Td className="max-w-[260px]">
                  <Link href={`/veiculos/${v.id}`} className="flex items-center gap-2.5">
                    <VehiclePhoto photo={v.photo} brand={v.brand} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-zinc-900 group-hover:underline group-hover:underline-offset-2">
                        {v.brand} {v.model}
                      </span>
                      <span className="block truncate text-xs text-zinc-500">{v.version ?? "—"}</span>
                    </span>
                  </Link>
                </Td>
                <Td className="max-w-[220px] truncate text-zinc-600">{v.purchase_seller ?? "—"}</Td>
                <Td className="text-zinc-500">{v.purchase_payment ?? "—"}</Td>
                <Td right className="text-zinc-600">
                  {brl(v.purchase_price)}
                </Td>
                <Td right className="text-zinc-500">
                  {brl(v.costs_total)}
                </Td>
                <Td right className="font-medium text-zinc-900">
                  {brl(v.total_cost)}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
