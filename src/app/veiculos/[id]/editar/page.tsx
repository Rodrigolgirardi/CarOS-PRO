import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { vehicleLabel } from "@/lib/metrics";
import { getVehicle } from "@/lib/queries/vehicles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar veículo" };

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = getVehicle(Number(id));
  if (!vehicle) notFound();

  return (
    <>
      <PageHeader
        backHref={`/veiculos/${vehicle.id}`}
        backLabel="Ficha do veículo"
        title={`Editar ${vehicleLabel(vehicle)}`}
        description="Alterações de preço de venda ficam registradas no histórico."
      />
      <VehicleForm vehicle={vehicle} />
    </>
  );
}
