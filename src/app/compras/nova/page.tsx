import { PageHeader } from "@/components/layout/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nova compra" };

export default function NewPurchasePage() {
  return (
    <>
      <PageHeader
        backHref="/compras"
        backLabel="Compras"
        title="Nova compra"
        description="Ao registrar, o veículo entra no estoque com o checklist de preparação criado."
      />
      <VehicleForm />
    </>
  );
}
