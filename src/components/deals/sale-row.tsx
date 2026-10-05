"use client";

import { useState } from "react";
import { brl, fmtDate } from "@/lib/format";
import type { DealRow } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Td } from "@/components/ui/table";
import { VehiclePhoto } from "@/components/vehicles/vehicle-photo";
import { DealDialog } from "./deal-dialog";

/** Linha do registro de vendas — clique abre a venda (entrega, desfazer, resumo). */
export function SaleRow({ deal }: { deal: DealRow }) {
  const [open, setOpen] = useState(false);
  const profit = deal.sale_price != null ? deal.sale_price - deal.vehicle_total_cost : null;

  return (
    <>
      <tr
        className="cursor-pointer transition-colors hover:bg-zinc-50/60"
        onClick={() => setOpen(true)}
        title="Abrir venda"
      >
        <Td className="text-zinc-500">{fmtDate(deal.sold_date)}</Td>
        <Td className="max-w-[230px]">
          <span className="flex items-center gap-2.5">
            <VehiclePhoto photo={deal.vehicle_photo} brand={deal.vehicle_label} size="xs" />
            <span className="truncate font-medium text-zinc-900">{deal.vehicle_label}</span>
          </span>
        </Td>
        <Td className="max-w-[160px] truncate text-zinc-600">{deal.customer_name}</Td>
        <Td className="max-w-[130px] truncate text-zinc-500">{deal.channel ?? "—"}</Td>
        <Td right className="font-medium">
          {brl(deal.sale_price)}
        </Td>
        <Td right className={`font-medium ${profit != null && profit < 0 ? "text-red-600" : "text-emerald-600"}`}>
          {profit == null ? "—" : brl(profit)}
        </Td>
        <Td right className="text-zinc-600">
          {brl(deal.received)}
        </Td>
        <Td right className={deal.pending > 0 ? "font-medium text-amber-600" : "text-zinc-300"}>
          {deal.pending > 0 ? brl(deal.pending) : "—"}
        </Td>
        <Td>
          <Badge tone={deal.stage === "entregue" ? "teal" : "emerald"} dot>
            {deal.stage === "entregue" ? "Entregue" : "Vendido"}
          </Badge>
        </Td>
      </tr>
      <DealDialog deal={deal} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
