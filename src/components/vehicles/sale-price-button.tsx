"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { setSalePrice } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

interface SalePriceButtonProps {
  vehicleId: number;
  current: number | null;
}

/** Define/altera o preço de venda — a mudança vai para o histórico. */
export function SalePriceButton({ vehicleId, current }: SalePriceButtonProps) {
  const [open, setOpen] = useState(false);
  const { state, formAction } = useAction(setSalePrice.bind(null, vehicleId), {
    onSuccess: () => setOpen(false),
  });

  return (
    <>
      {current == null ? (
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Definir preço
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Alterar preço de venda"
          className="grid size-6 place-items-center rounded-md text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
        >
          <Pencil size={12} />
        </button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={current == null ? "Definir preço de venda" : "Alterar preço de venda"}
        description="A alteração fica registrada no histórico do veículo."
      >
        <form action={formAction} className="space-y-4">
          <Field label="Preço de venda" required>
            <CurrencyInput name="sale_price" defaultCents={current} required autoFocus />
          </Field>
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton>Salvar preço</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
