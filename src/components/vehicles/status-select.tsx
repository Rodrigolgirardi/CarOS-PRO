"use client";

import { useTransition } from "react";
import { setVehicleStatus } from "@/lib/actions/vehicles";
import { VEHICLE_STATUS } from "@/lib/labels";
import type { VehicleStatus } from "@/lib/types";
import { Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

/** Troca manual de status (vendido só acontece via Vendas). */
export function StatusSelect({ id, status }: { id: number; status: VehicleStatus }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <Select
      value={status}
      disabled={pending}
      aria-label="Alterar status"
      onChange={(e) =>
        startTransition(async () => {
          const r = await setVehicleStatus(id, e.target.value);
          if (!r.ok) toast(r.error ?? "Não foi possível alterar.", "error");
        })
      }
      className="h-7 w-auto pr-7 text-xs"
    >
      {(Object.keys(VEHICLE_STATUS) as VehicleStatus[])
        .filter((s) => s !== "vendido")
        .map((s) => (
          <option key={s} value={s}>
            {VEHICLE_STATUS[s].label}
          </option>
        ))}
    </Select>
  );
}
