import { Database } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PlateCacheRow } from "@/components/plate-cache/plate-cache-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, Th, THead } from "@/components/ui/table";
import type { PlateData } from "@/lib/plate-lookup";
import { listPlateCache } from "@/lib/queries/plate-cache";

export const dynamic = "force-dynamic";
export const metadata = { title: "Banco de dados" };

export default async function PlateDatabasePage() {
  const rows = await listPlateCache();

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
          description="Consulte uma placa (botão vermelho em Veículos) e o resultado completo fica guardado aqui para sempre."
        />
      ) : (
        <Table>
          <THead>
            <Th />
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
              return <PlateCacheRow key={row.plate} row={row} data={data} />;
            })}
          </TBody>
        </Table>
      )}

      {rows.length > 0 && (
        <p className="mt-3 text-xs text-zinc-400">
          {rows.length} placa(s) salva(s) · clique na linha para ver tudo que a consulta retornou.
        </p>
      )}
    </>
  );
}
