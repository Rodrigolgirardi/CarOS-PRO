"use client";

import { useState } from "react";
import { brl, fmtDateShort } from "@/lib/format";
import type { DealRow } from "@/lib/types";
import { VehiclePhoto } from "@/components/vehicles/vehicle-photo";
import { DealDialog } from "./deal-dialog";

/** Cartão do pipeline — clique abre a negociação. */
export function DealCard({ deal }: { deal: DealRow }) {
  const [open, setOpen] = useState(false);
  const value = deal.sale_price ?? deal.proposed_price ?? deal.vehicle_sale_price;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-left transition-all hover:border-zinc-300 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
      >
        <div className="flex items-center gap-2.5">
          <VehiclePhoto photo={deal.vehicle_photo} brand={deal.vehicle_label} size="xs" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-zinc-900">{deal.vehicle_label}</p>
            <p className="truncate text-xs text-zinc-500">{deal.customer_name}</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between border-t border-zinc-100 pt-2">
          <span className="text-[13px] font-semibold tabular-nums text-zinc-900">{value != null ? brl(value) : "—"}</span>
          <span className="text-[11px] text-zinc-400">{fmtDateShort(deal.created_at.slice(0, 10))}</span>
        </div>
        {deal.pending > 0 && (
          <p className="mt-1.5 text-[11px] font-medium text-amber-600">{brl(deal.pending)} a receber</p>
        )}
      </button>
      <DealDialog deal={deal} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
