"use client";

import { useState, useTransition } from "react";
import { MessageSquarePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { addContact, deleteCustomer, saveCustomer, setCustomerStatus } from "@/lib/actions/customers";
import { todayISO } from "@/lib/format";
import { CUSTOMER_STATUS } from "@/lib/labels";
import type { Customer, CustomerStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { ConfirmButton } from "@/components/ui/confirm";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

function CustomerFields({ customer }: { customer?: Customer }) {
  return (
    <>
      <div className="grid grid-cols-[1fr_170px] gap-4">
        <Field label="Nome" required>
          <Input name="name" defaultValue={customer?.name} placeholder="João Pereira" required autoFocus />
        </Field>
        <Field label="Tipo" hint="Consignante = deixou carro na loja.">
          <Select name="kind" defaultValue={customer?.kind ?? "comprador"}>
            <option value="comprador">Comprador</option>
            <option value="consignante">Consignante</option>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="CPF/CNPJ">
          <Input name="cpf_cnpj" defaultValue={customer?.cpf_cnpj ?? ""} inputMode="numeric" />
        </Field>
        <Field label="Telefone">
          <Input name="phone" defaultValue={customer?.phone ?? ""} placeholder="(11) 99999-0000" />
        </Field>
        <Field label="E-mail">
          <Input name="email" type="email" defaultValue={customer?.email ?? ""} />
        </Field>
        <Field label="Cidade">
          <Input name="city" defaultValue={customer?.city ?? ""} />
        </Field>
      </div>
      <Field label="Observações">
        <Textarea name="notes" defaultValue={customer?.notes ?? ""} placeholder="Procura SUV automático até R$ 120 mil…" />
      </Field>
    </>
  );
}

export function CustomerCreateButton({ label = "Novo cliente" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const { state, formAction } = useAction(saveCustomer.bind(null, null), { onSuccess: () => setOpen(false) });
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus size={14} />
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo cliente">
        <form action={formAction} className="space-y-4">
          <CustomerFields />
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

export function CustomerEditButton({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);
  const { state, formAction } = useAction(saveCustomer.bind(null, customer.id), { onSuccess: () => setOpen(false) });
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Pencil size={13} />
        Editar
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Editar cliente">
        <form action={formAction} className="space-y-4">
          <CustomerFields customer={customer} />
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton>Salvar</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

/** Ações da linha na lista de clientes: lápis (editar) + lixeira (excluir). */
export function CustomerRowActions({ customer }: { customer: Customer }) {
  const [editOpen, setEditOpen] = useState(false);
  const { state, formAction } = useAction(saveCustomer.bind(null, customer.id), {
    onSuccess: () => setEditOpen(false),
  });

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Editar ${customer.name}`}
        className="size-8 p-0"
        onClick={() => setEditOpen(true)}
      >
        <Pencil size={14} />
      </Button>
      <ConfirmButton
        action={deleteCustomer.bind(null, customer.id)}
        title={`Excluir ${customer.name}?`}
        description="O cadastro, as negociações em aberto e os documentos vinculados serão removidos. Clientes com vendas registradas não podem ser excluídos."
        variant="danger-ghost"
        className="size-8 p-0"
      >
        <Trash2 size={15} />
      </ConfirmButton>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar cliente">
        <form action={formAction} className="space-y-4">
          <CustomerFields customer={customer} />
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

export function AddContactButton({ customerId }: { customerId: number }) {
  const [open, setOpen] = useState(false);
  const { state, formAction } = useAction(addContact.bind(null, customerId), { onSuccess: () => setOpen(false) });
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <MessageSquarePlus size={13} />
        Registrar contato
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Registrar contato"
        description="Ligação, visita, mensagem — fica no histórico do cliente."
      >
        <form action={formAction} className="space-y-4">
          <Field label="O que aconteceu?" required>
            <Textarea name="note" placeholder="Ligação: ainda interessado, volta sábado para test drive." required autoFocus />
          </Field>
          <Field label="Data">
            <Input type="date" name="date" defaultValue={todayISO()} />
          </Field>
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton>Registrar</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function CustomerStatusSelect({ id, status }: { id: number; status: CustomerStatus }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  return (
    <Select
      value={status}
      disabled={pending}
      aria-label="Status do cliente"
      onChange={(e) =>
        startTransition(async () => {
          const r = await setCustomerStatus(id, e.target.value);
          if (!r.ok) toast(r.error ?? "Não foi possível alterar.", "error");
        })
      }
      className="h-7 w-auto pr-7 text-xs"
    >
      {(Object.keys(CUSTOMER_STATUS) as CustomerStatus[]).map((s) => (
        <option key={s} value={s}>
          {CUSTOMER_STATUS[s].label}
        </option>
      ))}
    </Select>
  );
}
