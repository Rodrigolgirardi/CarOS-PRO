import Link from "next/link";
import { FileText, Files, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { UploadDocButton } from "@/components/documents/upload-doc-button";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm";
import { EmptyState } from "@/components/ui/empty-state";
import { Chips } from "@/components/ui/tabs";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { deleteDocument } from "@/lib/actions/documents";
import { fmtBytes, fmtDate } from "@/lib/format";
import { DOC_TYPE } from "@/lib/labels";
import { customerOptions } from "@/lib/queries/customers";
import { documentCounts, listDocuments } from "@/lib/queries/documents";
import { vehicleOptions } from "@/lib/queries/vehicles";
import type { DocumentType } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Documentos" };

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const filter = tipo && tipo in DOC_TYPE ? (tipo as DocumentType) : "todos";
  const docs = listDocuments(filter === "todos" ? undefined : filter);
  const counts = documentCounts();
  const vehicles = vehicleOptions({ includeSold: true });
  const customers = customerOptions();

  return (
    <>
      <PageHeader
        title="Documentos"
        description="CRLV, ATPV-e, contratos, laudos e comprovantes — sempre ligados a um veículo ou cliente."
        actions={<UploadDocButton vehicles={vehicles} customers={customers} />}
      />

      <Chips
        className="mb-4"
        activeKey={filter}
        items={[
          { key: "todos", label: "Todos", count: counts.todos, href: "/documentos" },
          ...(Object.keys(DOC_TYPE) as DocumentType[]).map((t) => ({
            key: t,
            label: DOC_TYPE[t],
            count: counts[t] ?? 0,
            href: `/documentos?tipo=${t}`,
          })),
        ]}
      />

      {docs.length === 0 ? (
        <EmptyState
          icon={Files}
          title="Nenhum documento"
          description="Envie arquivos e vincule a veículos e clientes para achar tudo na hora."
        />
      ) : (
        <Table>
          <THead>
            <Th>Documento</Th>
            <Th>Tipo</Th>
            <Th>Veículo</Th>
            <Th>Cliente</Th>
            <Th right>Tamanho</Th>
            <Th>Data</Th>
            <Th />
          </THead>
          <TBody>
            {docs.map((d) => (
              <Tr key={d.id}>
                <Td className="max-w-[280px]">
                  <a
                    href={`/api/uploads/${encodeURIComponent(d.file_name)}`}
                    target="_blank"
                    className="flex items-center gap-2 font-medium text-zinc-800 underline-offset-2 hover:underline"
                  >
                    <FileText size={14} className="shrink-0 text-zinc-300" />
                    <span className="truncate">{d.name}</span>
                  </a>
                </Td>
                <Td>
                  <Badge>{DOC_TYPE[d.type]}</Badge>
                </Td>
                <Td className="max-w-[200px] truncate">
                  {d.vehicle_id ? (
                    <Link href={`/veiculos/${d.vehicle_id}?tab=documentos`} className="text-zinc-600 underline-offset-2 hover:underline">
                      {d.vehicle_label}
                    </Link>
                  ) : (
                    <span className="text-zinc-300">—</span>
                  )}
                </Td>
                <Td className="max-w-[160px] truncate">
                  {d.customer_id ? (
                    <Link href={`/clientes/${d.customer_id}`} className="text-zinc-600 underline-offset-2 hover:underline">
                      {d.customer_name}
                    </Link>
                  ) : (
                    <span className="text-zinc-300">—</span>
                  )}
                </Td>
                <Td right className="text-zinc-500">
                  {fmtBytes(d.size)}
                </Td>
                <Td className="text-zinc-500">{fmtDate(d.created_at.slice(0, 10))}</Td>
                <Td className="w-10">
                  <ConfirmButton
                    action={deleteDocument.bind(null, d.id)}
                    title={`Excluir ${d.name}?`}
                    description="O arquivo será apagado do disco."
                    variant="danger-ghost"
                    className="size-8 p-0"
                  >
                    <Trash2 size={16} />
                  </ConfirmButton>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
