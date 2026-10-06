"use client";

import { useState } from "react";
import { Check, Eye, Trash2 } from "lucide-react";
import { choosePlateFipe, deletePlateCache } from "@/lib/actions/plate";
import { brl } from "@/lib/format";
import type { PlateData } from "@/lib/plate-lookup";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm";
import { Modal } from "@/components/ui/modal";

interface PlateCacheActionsProps {
  plate: string;
  data: PlateData;
}

/** Ações da linha do banco de placas: ver tudo que a consulta retornou + excluir. */
export function PlateCacheActions({ plate, data }: PlateCacheActionsProps) {
  const [open, setOpen] = useState(false);
  const title = [data.brand, data.model, data.version].filter(Boolean).join(" ") || plate;

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button variant="ghost" size="sm" className="size-8 p-0" aria-label="Ver detalhes" onClick={() => setOpen(true)}>
        <Eye size={15} />
      </Button>
      <ConfirmButton
        action={deletePlateCache.bind(null, plate)}
        title={`Remover ${plate} do banco?`}
        description="A próxima busca desta placa consultará a API de novo (cobrada)."
        confirmLabel="Remover"
        variant="danger-ghost"
        className="size-8 p-0"
      >
        <Trash2 size={15} />
      </ConfirmButton>

      <Modal open={open} onClose={() => setOpen(false)} title={title} description={`Placa ${plate}`} wide>
        <div className="space-y-4">
          {(data.situation || data.restrictions.length > 0) && (
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
              <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
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
                          action={choosePlateFipe.bind(null, plate, f.code)}
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
              {data.chosenFipe && (
                <p className="mt-1.5 text-xs text-zinc-400">
                  A versão escolhida fica salva e preenche o formulário quando você buscar esta placa.
                </p>
              )}
            </section>
          )}

          {data.details.length > 0 && (
            <section>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Tudo que a consulta retornou
              </h3>
              <dl className="grid grid-cols-1 gap-x-8 rounded-lg border border-zinc-200 px-3 py-1 sm:grid-cols-2">
                {data.details.map((d) => (
                  <div key={d.label} className="flex items-baseline justify-between gap-3 py-1.5">
                    <dt className="shrink-0 text-xs text-zinc-500">{d.label}</dt>
                    <dd className="min-w-0 truncate text-right text-[13px] font-medium text-zinc-900">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setOpen(false)}>Fechar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
