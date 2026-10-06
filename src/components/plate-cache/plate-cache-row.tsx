"use client";

import { useState } from "react";
import { Check, ChevronRight, Trash2 } from "lucide-react";
import { choosePlateFipe, deletePlateCache } from "@/lib/actions/plate";
import { brl, fmtDate } from "@/lib/format";
import type { PlateData } from "@/lib/plate-lookup";
import type { PlateCacheRow as Row } from "@/lib/queries/plate-cache";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm";
import { Td } from "@/components/ui/table";
import { BrandLogo } from "@/components/vehicles/brand-logo";

/** Linha do banco de placas: a seta expande tudo que a consulta retornou. */
export function PlateCacheRow({ row, data }: { row: Row; data: PlateData | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className="cursor-pointer transition-colors hover:bg-zinc-50/60"
        onClick={() => setOpen((o) => !o)}
        title={open ? "Recolher" : "Ver todas as informações"}
      >
        <Td className="w-8 pr-0">
          <ChevronRight
            size={15}
            className={`text-zinc-400 transition-transform ${open ? "rotate-90" : ""}`}
          />
        </Td>
        <Td>
          <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[11px] text-zinc-600">
            {row.plate}
          </span>
        </Td>
        <Td className="max-w-[280px]">
          <span className="flex items-center gap-2">
            <BrandLogo brand={row.brand} size={16} />
            <span className="truncate font-medium text-zinc-900">
              {[row.brand, row.model, row.version].filter(Boolean).join(" ") || "—"}
            </span>
          </span>
        </Td>
        <Td className="text-zinc-500">
          {row.year_fab
            ? `${String(row.year_fab).slice(-2)}/${String(row.year_model ?? row.year_fab).slice(-2)}`
            : "—"}
        </Td>
        <Td className="text-zinc-600">{row.color ?? "—"}</Td>
        <Td className="text-zinc-600">{row.fuel ?? "—"}</Td>
        <Td className="text-zinc-500">{fmtDate(row.created_at.slice(0, 10))}</Td>
        <Td className="w-12">
          <span onClick={(e) => e.stopPropagation()}>
            <ConfirmButton
              action={deletePlateCache.bind(null, row.plate)}
              title={`Remover ${row.plate} do banco?`}
              description="A próxima busca desta placa consultará a API de novo (cobrada)."
              confirmLabel="Remover"
              variant="danger-ghost"
              className="size-8 p-0"
            >
              <Trash2 size={15} />
            </ConfirmButton>
          </span>
        </Td>
      </tr>

      {open && data && (
        <tr className="bg-zinc-50/50">
          <td colSpan={8} className="px-4 py-4">
            <div className="space-y-4 pl-7">
              {(data.situation || data.restrictions.length > 0 || data.chassis) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {data.situation && <Badge tone="zinc">{data.situation}</Badge>}
                  {data.restrictions.length === 0 ? (
                    <Badge tone="emerald" dot>
                      Nada consta
                    </Badge>
                  ) : (
                    data.restrictions.map((r) => (
                      <Badge key={r} tone="red" dot>
                        {r}
                      </Badge>
                    ))
                  )}
                </div>
              )}

              {data.fipe.length > 0 && (
                <section>
                  <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    FIPE {data.fipe.length > 1 && !data.chosenFipe && "— qual é a versão deste carro?"}
                  </h3>
                  <ul className="max-w-2xl divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
                    {data.fipe.map((f) => {
                      const chosen = data.chosenFipe === f.code;
                      return (
                        <li
                          key={f.code}
                          className={`flex items-center justify-between gap-3 px-3 py-2 ${chosen ? "bg-emerald-50/50" : ""}`}
                        >
                          <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-700">{f.model}</span>
                          <span className="shrink-0 text-[13px] font-semibold tabular-nums text-zinc-900">
                            {f.valueCents != null ? brl(f.valueCents) : f.valueText}
                          </span>
                          {chosen ? (
                            <Badge tone="emerald" className="shrink-0">
                              <Check size={11} strokeWidth={3} />
                              Versão do carro
                            </Badge>
                          ) : (
                            <ActionButton
                              action={choosePlateFipe.bind(null, row.plate, f.code)}
                              variant="secondary"
                              size="sm"
                              className="shrink-0"
                            >
                              Usar esta
                            </ActionButton>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {(data.details.length > 0 || data.chassis || data.city) && (
                <section>
                  <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Tudo que a consulta retornou
                  </h3>
                  <dl className="grid grid-cols-1 gap-x-10 rounded-lg border border-zinc-200 bg-white px-4 py-1 sm:grid-cols-2 xl:grid-cols-3">
                    {data.chassis && (
                      <div className="flex items-baseline justify-between gap-3 py-1.5">
                        <dt className="shrink-0 text-xs text-zinc-500">Chassi</dt>
                        <dd className="min-w-0 truncate text-right font-mono text-xs font-medium text-zinc-900">
                          {data.chassis}
                        </dd>
                      </div>
                    )}
                    {data.city && (
                      <div className="flex items-baseline justify-between gap-3 py-1.5">
                        <dt className="shrink-0 text-xs text-zinc-500">Cidade</dt>
                        <dd className="min-w-0 truncate text-right text-[13px] font-medium text-zinc-900">
                          {data.city}
                          {data.uf ? `/${data.uf}` : ""}
                        </dd>
                      </div>
                    )}
                    {data.details.map((d) => (
                      <div key={d.label} className="flex items-baseline justify-between gap-3 py-1.5">
                        <dt className="shrink-0 text-xs text-zinc-500">{d.label}</dt>
                        <dd className="min-w-0 truncate text-right text-[13px] font-medium text-zinc-900">
                          {d.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
