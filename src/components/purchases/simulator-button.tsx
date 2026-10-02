"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { brl, pct } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

/** Calculadora rápida de compra: custo total, lucro e margem ao vivo. */
export function SimulatorButton() {
  const [open, setOpen] = useState(false);
  const [purchase, setPurchase] = useState<number | null>(null);
  const [costs, setCosts] = useState<number | null>(null);
  const [sale, setSale] = useState<number | null>(null);

  const totalCost = (purchase ?? 0) + (costs ?? 0);
  const profit = sale != null ? sale - totalCost : null;
  const margin = sale != null && sale > 0 && profit != null ? profit / sale : null;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Calculator size={14} />
        Simulador
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Simulador de compra"
        description="Vale a pena comprar? Faça a conta antes de fechar."
      >
        <div className="space-y-4">
          <Field label="Preço de compra">
            <CurrencyInput onCentsChange={setPurchase} autoFocus />
          </Field>
          <Field label="Custos estimados" hint="Transferência, preparação, anúncios…">
            <CurrencyInput onCentsChange={setCosts} />
          </Field>
          <Field label="Preço esperado de venda">
            <CurrencyInput onCentsChange={setSale} />
          </Field>

          <dl className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Custo total</dt>
              <dd className="font-semibold tabular-nums text-zinc-900">{brl(totalCost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Lucro estimado</dt>
              <dd
                className={`font-semibold tabular-nums ${
                  profit == null ? "text-zinc-300" : profit >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {profit == null ? "—" : brl(profit)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Margem</dt>
              <dd className="font-semibold tabular-nums text-zinc-900">{pct(margin)}</dd>
            </div>
          </dl>
        </div>
      </Modal>
    </>
  );
}
