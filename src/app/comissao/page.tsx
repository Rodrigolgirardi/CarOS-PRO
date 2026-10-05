import { Percent } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SellerCreateButton, SellerRowActions } from "@/components/sellers/seller-dialogs";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { brl } from "@/lib/format";
import { listSellers } from "@/lib/queries/sellers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comissão" };

export default function CommissionPage() {
  const sellers = listSellers();

  return (
    <>
      <PageHeader
        title="Comissão"
        description="Seus vendedores e a comissão de cada um — usada na venda rápida."
        actions={<SellerCreateButton />}
      />

      {sellers.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="Nenhum vendedor cadastrado"
          description="Cadastre os vendedores e a % padrão de comissão. Ao registrar uma venda pelo botão Vendido, a comissão é sugerida automaticamente."
          action={<SellerCreateButton />}
        />
      ) : (
        <Table>
          <THead>
            <Th>Vendedor</Th>
            <Th right>Comissão padrão</Th>
            <Th right>Vendas</Th>
            <Th right>Comissão acumulada</Th>
            <Th />
          </THead>
          <TBody>
            {sellers.map((s) => (
              <Tr key={s.id}>
                <Td className="font-medium text-zinc-900">{s.name}</Td>
                <Td right className="tabular-nums text-zinc-600">
                  {s.commission_fixed != null
                    ? `${brl(s.commission_fixed)} por venda`
                    : s.commission_pct != null
                      ? `${String(s.commission_pct).replace(".", ",")}%`
                      : "—"}
                </Td>
                <Td right className="tabular-nums text-zinc-600">
                  {s.sales_count}
                </Td>
                <Td right className="font-medium tabular-nums text-zinc-900">
                  {brl(s.commission_total)}
                </Td>
                <Td className="w-20">
                  <SellerRowActions seller={s} />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
