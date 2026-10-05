import Link from "next/link";
import { FileText, KeyRound, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { UploadDocButton } from "@/components/documents/upload-doc-button";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { deleteDocument } from "@/lib/actions/documents";
import { fmtBytes, fmtDate } from "@/lib/format";
import { DOC_TYPE } from "@/lib/labels";
import { customerOptions } from "@/lib/queries/customers";
import { listConsignmentDocs } from "@/lib/queries/documents";
import { vehicleOptions } from "@/lib/queries/vehicles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Consignados" };

// Papelada da consignação: termos, contratos e documentos dos carros de terceiros.
export default function ConsignedPage() {
  const docs = listConsignmentDocs();
  const consignedVehicles = vehicleOptions({ consignedOnly: true, includeSold: true });

  return (
    <>
      <PageHeader
        title="Consignados"
        description="Termos de consignação, contratos e documentos dos carros de terceiros."
        actions={
          <UploadDocButton
            vehicles={consignedVehicles}
            customers={customerOptions()}
            defaultType="termo_consignacao"
            label="Enviar termo / contrato"
          />
        }
      />

      {docs.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="Nenhum termo ou contrato ainda"
          description="Envie o termo de consignação assinado, contratos e outros documentos — vinculados ao carro consignado para achar tudo na hora."
          action={
            <UploadDocButton
              vehicles={consignedVehicles}
              customers={customerOptions()}
              defaultType="termo_consignacao"
              label="Enviar termo / contrato"
            />
          }
        />
      ) : (
        <Table>
          <THead>
            <Th>Documento</Th>
            <Th>Tipo</Th>
            <Th>Veículo</Th>
            <Th right>Tamanho</Th>
            <Th>Data</Th>
            <Th />
          </THead>
          <TBody>
            {docs.map((d) => (
              <Tr key={d.id}>
                <Td className="max-w-[300px]">
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
                <Td className="max-w-[220px] truncate">
                  {d.vehicle_id ? (
                    <Link
                      href={`/veiculos/${d.vehicle_id}?tab=documentos`}
                      className="text-zinc-600 underline-offset-2 hover:underline"
                    >
                      {d.vehicle_label}
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
