import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { DeleteVehicleButton } from "@/components/vehicles/vehicle-row-actions";
import { vehicleLabel } from "@/lib/metrics";
import { getVehicle } from "@/lib/queries/vehicles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar veículo" };

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await getVehicle(Number(id));
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
      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/50 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-red-600">Zona de perigo</p>
        <p className="mt-1 text-[13px] text-zinc-600">
          Excluir remove custos, documentos e histórico. Não dá para desfazer.
        </p>
        <div className="mt-3">
          <DeleteVehicleButton
            id={vehicle.id}
            label={vehicleLabel(vehicle)}
            redirectAfterDelete="/veiculos"
          />
        </div>
      </div>
    </>
  );
}
