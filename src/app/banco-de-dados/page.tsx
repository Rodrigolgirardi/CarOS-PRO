import { Database } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PlateCacheActions } from "@/components/plate-cache/plate-cache-actions";
import { BrandLogo } from "@/components/vehicles/brand-logo";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { fmtDate } from "@/lib/format";
import type { PlateData } from "@/lib/plate-lookup";
import { listPlateCache } from "@/lib/queries/plate-cache";

export const dynamic = "force-dynamic";
export const metadata = { title: "Banco de dados" };

export default function PlateDatabasePage() {
  const rows = listPlateCache();

  return (
    <>
      <PageHeader
        title="Banco de dados"
        description="Cada placa consultada fica salva aqui — repetir a busca usa o que já foi pago, sem nova cobrança."
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Database}
          title="Nenhuma placa salva ainda"
          description="Busque uma placa em Compras → Nova compra e o resultado completo fica guardado aqui para sempre."
        />
      ) : (
        <Table>
          <THead>
            <Th>Placa</Th>
            <Th>Veículo</Th>
            <Th>Ano</Th>
            <Th>Cor</Th>
            <Th>Combustível</Th>
            <Th>Consultada em</Th>
            <Th />
          </THead>
          <TBody>
            {rows.map((row) => {
              let data: PlateData | null = null;
              try {
                data = JSON.parse(row.data) as PlateData;
              } catch {
                data = null;
              }
              return (
                <Tr key={row.plate}>
                  <Td>
                    <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[11px] text-zinc-600">
                      {row.plate}
                    </span>
                  </Td>
                  <Td className="max-w-[280px]">
                    <span className="flex items-center gap-2">
                      <BrandLogo brand={row.brand} size={16} />
                      <span className="truncate font-medium text-zinc-900">
                        {[row.brand, row.model, row.version].filter(Boolean).join(" ") || "—"}
                      </span>
                    </span>
                  </Td>
                  <Td className="text-zinc-500">
                    {row.year_fab
                      ? `${String(row.year_fab).slice(-2)}/${String(row.year_model ?? row.year_fab).slice(-2)}`
                      : "—"}
                  </Td>
                  <Td className="text-zinc-600">{row.color ?? "—"}</Td>
                  <Td className="text-zinc-600">{row.fuel ?? "—"}</Td>
                  <Td className="text-zinc-500">{fmtDate(row.created_at.slice(0, 10))}</Td>
                  <Td className="w-20">{data && <PlateCacheActions plate={row.plate} data={data} />}</Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      )}

      {rows.length > 0 && (
        <p className="mt-3 text-xs text-zinc-400">
          {rows.length} placa(s) salva(s) · cada uma representa uma consulta que você não paga de novo.
        </p>
      )}
    </>
  );
}
