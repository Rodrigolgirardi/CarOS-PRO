import { Database } from "lucide-react";
import { PlateCacheRow } from "@/components/plate-cache/plate-cache-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, Th, THead } from "@/components/ui/table";
import type { PlateData } from "@/lib/plate-lookup";
import { listPlateCache } from "@/lib/queries/plate-cache";

/** Placas consultadas (cache pago) — vive na aba Banco de dados em Configurações. */
export async function PlateCachePanel() {
  const rows = await listPlateCache();

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Database}
        title="Nenhuma placa salva ainda"
        description="Consulte uma placa (botão vermelho em Veículos) e o resultado completo fica guardado aqui para sempre."
      />
    );
  }

  return (
    <>
      <Table>
        <THead>
          <Th />
          <Th>Placa</Th>
          <Th>Veículo</Th>
          <Th className="max-sm:hidden">Ano</Th>
          <Th className="max-sm:hidden">Cor</Th>
          <Th right className="w-px">
            <span className="sm:hidden">Data</span>
            <span className="hidden sm:inline">Consultada em</span>
          </Th>
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
      <p className="mt-3 text-xs text-zinc-400">
        {rows.length} placa(s) salva(s) · clique na linha para ver tudo que a consulta retornou.
      </p>
    </>
  );
}
