"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { brl } from "@/lib/format";
import type { DealRow } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/vehicles/brand-logo";
import { DealDialog } from "./deal-dialog";

function Info({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-0.5 break-words text-[13px] font-medium ${valueClass ?? "text-zinc-900"}`}>{value ?? "—"}</p>
    </div>
  );
}

/** Venda em linha compacta: data, veículo, cliente e valor — detalhes expandem. */
export function SaleExpandRow({ deal }: { deal: DealRow }) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const profit = deal.sale_price != null ? deal.sale_price - deal.vehicle_total_cost : null;
  const d = deal.sold_date;
  const shortDate = d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(2, 4)}` : "—";
  // dias da compra até a venda
  const daysToSell =
    deal.sold_date && deal.purchase_date
      ? Math.max(Math.round((Date.parse(deal.sold_date) - Date.parse(deal.purchase_date)) / 86_400_000), 0)
      : null;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((o) => !o);
        }}
        className="flex cursor-pointer items-center gap-2.5 px-3.5 py-3 transition-colors hover:bg-zinc-50"
      >
        <span className="shrink-0 text-xs tabular-nums text-zinc-500">{shortDate}</span>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <BrandLogo brand={deal.vehicle_label} size={16} />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-zinc-900">{deal.vehicle_label}</span>
            <span className="block truncate text-[11px] text-zinc-500">{deal.customer_name}</span>
          </span>
        </span>
        <span className="shrink-0 text-[13px] font-semibold tabular-nums text-zinc-900">{brl(deal.sale_price)}</span>
        <ChevronRight size={15} className={`shrink-0 text-zinc-300 transition-transform ${open ? "rotate-90" : ""}`} />
      </div>

      {open && (
        <div className="space-y-3 border-t border-zinc-100 bg-zinc-50/50 px-3.5 py-3.5">
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">
            <Info
              label="Lucro"
              value={profit == null ? "—" : brl(profit)}
              valueClass={profit != null && profit < 0 ? "text-red-600" : "text-emerald-600"}
            />
            <Info label="Recebido" value={brl(deal.received)} />
            <Info
              label="Tempo até vender"
              value={daysToSell != null ? `${daysToSell} ${daysToSell === 1 ? "dia" : "dias"}` : "—"}
            />
            <Info label="Canal" value={deal.channel} />
            <Info
              label="Status"
              value={
                <Badge tone={deal.stage === "entregue" ? "teal" : "emerald"} dot>
                  {deal.stage === "entregue" ? "Entregue" : "Vendido"}
                </Badge>
              }
            />
            <div className="flex items-end">
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                Abrir venda
              </Button>
            </div>
          </div>
        </div>
      )}
      <DealDialog deal={deal} open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
