"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createSeller, deleteSeller, updateSeller } from "@/lib/actions/sellers";
import type { Seller } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, Input, Select } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

function SellerFields({ seller }: { seller?: Seller }) {
  const [type, setType] = useState<"pct" | "fixed">(seller?.commission_fixed != null ? "fixed" : "pct");
  return (
    <>
      <Field label="Nome" required>
        <Input name="name" defaultValue={seller?.name ?? ""} placeholder="Carlos Andrade" required autoFocus={!seller} />
      </Field>
      <div className="grid grid-cols-[150px_1fr] gap-4">
        <Field label="Tipo de comissão">
          <Select name="commission_type" value={type} onChange={(e) => setType(e.target.value as "pct" | "fixed")}>
            <option value="pct">% da venda</option>
            <option value="fixed">Valor fixo (R$)</option>
          </Select>
        </Field>
        {type === "pct" ? (
          <Field label="Comissão padrão (%)" hint="Calculada sobre o valor da venda.">
            <Input
              name="commission_pct"
              defaultValue={seller?.commission_pct != null ? String(seller.commission_pct).replace(".", ",") : ""}
              inputMode="decimal"
              placeholder="1,5"
            />
          </Field>
        ) : (
          <Field label="Comissão padrão (R$)" hint="Valor fixo por venda.">
            <CurrencyInput name="commission_fixed" defaultCents={seller?.commission_fixed} />
          </Field>
        )}
      </div>
    </>
  );
}

export function SellerCreateButton() {
  const [open, setOpen] = useState(false);
  const { state, formAction } = useAction(createSeller, { onSuccess: () => setOpen(false) });
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus size={14} />
        Novo vendedor
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Novo vendedor"
        description="A % padrão sugere a comissão automaticamente ao registrar uma venda."
      >
        <form action={formAction} className="space-y-4">
          <SellerFields />
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton>Cadastrar</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function SellerRowActions({ seller }: { seller: Seller }) {
  const [editOpen, setEditOpen] = useState(false);
  const { state, formAction } = useAction(updateSeller.bind(null, seller.id), {
    onSuccess: () => setEditOpen(false),
  });

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button variant="ghost" size="sm" aria-label="Editar vendedor" className="size-8 p-0" onClick={() => setEditOpen(true)}>
        <Pencil size={14} />
      </Button>
      <ConfirmButton
        action={deleteSeller.bind(null, seller.id)}
        title="Remover vendedor?"
        description={`${seller.name} será removido. As vendas já registradas continuam no histórico.`}
        variant="danger-ghost"
        className="size-8 p-0"
      >
        <Trash2 size={16} />
      </ConfirmButton>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar vendedor">
        <form action={formAction} className="space-y-4">
          <SellerFields seller={seller} />
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
            <SubmitButton>Salvar</SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
