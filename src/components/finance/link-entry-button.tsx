"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { linkCashEntry } from "@/lib/actions/finance";
import type { VehicleOption } from "@/lib/queries/vehicles";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

interface LinkEntryButtonProps {
  kind: "custo" | "conta";
  sourceId: number;
  vehicles: VehicleOption[];
  currentVehicleId?: number | null;
}

/** Vincula um gasto do extrato a um carro (caso tenha esquecido na hora). */
export function LinkEntryButton({ kind, sourceId, vehicles, currentVehicleId }: LinkEntryButtonProps) {
  const [open, setOpen] = useState(false);
  const { state, formAction } = useAction(linkCashEntry.bind(null, kind, sourceId), {
    onSuccess: () => setOpen(false),
  });

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Vincular a um veículo"
        title="Vincular a um veículo"
        className="size-9 p-0"
        onClick={() => setOpen(true)}
      >
        <Link2 size={21} />
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Vincular a um veículo"
        description="O gasto passa a contar nos custos do carro escolhido."
      >
        <form action={formAction} className="space-y-4">
          <Field label="Veículo" required={kind === "custo"}>
            <Select
              name="vehicle_id"
              defaultValue={currentVehicleId ? String(currentVehicleId) : ""}
              required={kind === "custo"}
            >
              {kind === "conta" && <option value="">— sem veículo</option>}
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                  {v.plate ? ` · ${v.plate}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton>Vincular</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
