import { PageHeader } from "@/components/layout/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nova compra" };

export default async function NewPurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const consigned = tipo === "consignado";
  return (
    <>
      <PageHeader
        backHref={consigned ? "/consignados" : "/compras"}
        backLabel={consigned ? "Consignados" : "Compras"}
        title={consigned ? "Novo consignado" : "Nova compra"}
        description={
          consigned
            ? "Carro de terceiro entra na loja sem compra e sem saída de caixa — o repasse ao dono vira custo só na venda."
            : "Ao registrar, o veículo entra no estoque com o checklist de preparação criado."
        }
      />
      <VehicleForm defaultConsigned={consigned} />
    </>
  );
}
