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
    // largura fixa para o seletor ficar na mesma linha do badge de status
    <span className="inline-block w-[6rem]">
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
        className="h-7 px-2 pr-6 text-[11px]"
      >
      {(Object.keys(VEHICLE_STATUS) as VehicleStatus[])
        .filter((s) => s !== "vendido")
        .map((s) => (
          <option key={s} value={s}>
            {VEHICLE_STATUS[s].label}
          </option>
        ))}
      </Select>
    </span>
  );
}
