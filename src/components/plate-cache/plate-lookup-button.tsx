"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, ScanSearch } from "lucide-react";
import { lookupPlate, savePlateApiToken } from "@/lib/actions/plate";
import { brl } from "@/lib/format";
import type { PlateData } from "@/lib/plate-lookup";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { BrandLogo } from "@/components/vehicles/brand-logo";

/** Consulta avulsa de placa — o resultado completo vai para o Banco de dados. */
export function PlateLookupButton() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ data: PlateData; cached: boolean } | null>(null);
  const [needsToken, setNeedsToken] = useState(false);
  const [pending, startLookup] = useTransition();
  const plateRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const doLookup = () =>
    startLookup(async () => {
      const r = await lookupPlate(plateRef.current?.value ?? "");
      if (!r.ok) {
        if (r.needsToken) setNeedsToken(true);
        else toast(r.error, "error");
        return;
      }
      setResult({ data: r.data, cached: r.cached ?? false });
    });

  const tokenForm = useAction(savePlateApiToken, {
    onSuccess: () => {
      setNeedsToken(false);
      doLookup();
    },
  });

  const close = () => {
    setOpen(false);
    setResult(null);
    setNeedsToken(false);
  };

  const d = result?.data;
  const label = d ? [d.brand, d.model, d.version].filter(Boolean).join(" ") : "";

  return (
    <>
      <Button variant="danger-solid" onClick={() => setOpen(true)}>
        <ScanSearch size={14} />
        Consulta placa
      </Button>
      <Modal
        open={open}
        onClose={close}
        title="Consulta de placa"
        description="O resultado completo fica salvo no Banco de dados — a mesma placa nunca é cobrada duas vezes."
      >
        {d ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
              <BrandLogo brand={d.brand} size={34} className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">{label || "Veículo"}</p>
                <p className="mt-0.5 text-[13px] text-zinc-500">
                  {[
                    d.year_fab ? `${d.year_fab}/${d.year_model ?? d.year_fab}` : null,
                    d.color,
                    d.fuel,
                    d.city ? `${d.city}${d.uf ? `/${d.uf}` : ""}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {d.restrictions.length === 0 ? (
                    <Badge tone="emerald" dot>
                      Nada consta
                    </Badge>
                  ) : (
                    d.restrictions.map((r) => (
                      <Badge key={r} tone="red" dot>
                        {r}
                      </Badge>
                    ))
                  )}
                  {d.fipe[0]?.valueCents != null && <Badge tone="blue">FIPE {brl(d.fipe[0].valueCents)}</Badge>}
                </div>
              </div>
            </div>
            <p className="text-xs font-medium text-emerald-600">
              {result?.cached
                ? "✓ Já estava no seu banco — consulta sem custo."
                : "✓ Consulta salva no Banco de dados."}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <LinkButton href="/banco-de-dados" variant="ghost" onClick={close}>
                Ver banco de dados
              </LinkButton>
              <Button
                onClick={() => {
                  setResult(null);
                  setTimeout(() => plateRef.current?.focus(), 0);
                }}
              >
                Consultar outra
              </Button>
              <Button variant="primary" onClick={close}>
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Placa" required>
              <div className="flex gap-1.5">
                <Input
                  ref={plateRef}
                  placeholder="ABC1D23"
                  autoFocus
                  className="flex-1 uppercase"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      doLookup();
                    }
                  }}
                />
                <Button variant="danger-solid" onClick={doLookup} disabled={pending} className="shrink-0">
                  {pending ? <Loader2 size={13} className="animate-spin" /> : <ScanSearch size={13} />}
                  Consultar
                </Button>
              </div>
            </Field>

            {needsToken && (
              <form action={tokenForm.formAction} className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
                <Field label="Token do provedor" required hint="Fica salvo apenas no banco local deste computador.">
                  <Input name="token" required autoFocus autoComplete="off" placeholder="Cole aqui o seu token" />
                </Field>
                <FormError state={tokenForm.state} />
                <div className="flex items-center justify-between gap-2">
                  <a
                    href="https://apiplacas.com.br"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-900"
                  >
                    Obter um token →
                  </a>
                  <SubmitButton>Salvar e consultar</SubmitButton>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
