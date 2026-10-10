"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { updateConsignor } from "@/lib/actions/customers";
import { deleteConsignment } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm";
import { CpfCnpjInput } from "@/components/ui/cpf-cnpj-input";
import { Field, Input } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { PhoneInput } from "@/components/ui/phone-input";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { BrandLogo } from "@/components/vehicles/brand-logo";
import { brl } from "@/lib/format";
import type { ConsignmentRow } from "@/lib/queries/vehicles";

function fmtPhone(raw: string | null): string | null {
  const d = (raw ?? "").replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw || null;
}

function fmtCpfCnpj(raw: string | null): string | null {
  const d = (raw ?? "").replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return raw || null;
}

const fmtDay = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/** "Hoje, 14:20" · "Ontem" · "01/09/2026, 10:05" — a hora vem do cadastro, quando foi no mesmo dia. */
function enteredAt(row: ConsignmentRow): string {
  const [createdDay, createdTime] = row.created_at.split(" ");
  const day = row.consignado_date ?? createdDay!;
  const time = createdDay === day ? createdTime?.slice(0, 5) : undefined;
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const label = day === iso(today) ? "Hoje" : day === iso(yesterday) ? "Ontem" : fmtDay(day);
  return time ? `${label}, ${time}` : label;
}

function daysSince(iso: string): number {
  const start = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / 86_400_000));
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 break-words text-[13px] font-medium text-zinc-900">{value ?? "—"}</p>
    </div>
  );
}

/** Lápis ao lado do dono: edita nome, WhatsApp, CPF e e-mail (gravados no carro). */
function ConsignorEditPencil({ row: r }: { row: ConsignmentRow }) {
  const [open, setOpen] = useState(false);
  const { state, formAction } = useAction(updateConsignor.bind(null, r.id), {
    onSuccess: () => setOpen(false),
  });
  return (
    // cliques e teclas não vazam para a linha (senão ela abriria/fecharia)
    <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="contents">
      <button
        type="button"
        aria-label={`Editar ${r.owner}`}
        onClick={() => setOpen(true)}
        className="grid size-6 shrink-0 place-items-center rounded-md text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
      >
        <Pencil size={13} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Dados do proprietário" description={r.label}>
        <form action={formAction} className="space-y-4">
          <Field label="Nome" required>
            <Input name="name" defaultValue={r.owner} required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="WhatsApp" required>
              <PhoneInput name="phone" defaultValue={r.phone ?? ""} placeholder="(11) 99999-0000" required minLength={14} />
            </Field>
            <Field label="CPF" required>
              <CpfCnpjInput name="cpf" defaultValue={r.cpf} required />
            </Field>
          </div>
          <Field label="E-mail">
            <Input type="email" name="email" defaultValue={r.email ?? ""} placeholder="nome@email.com" />
          </Field>
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton>Salvar</SubmitButton>
          </div>
        </form>
      </Modal>
    </span>
  );
}

/** Linha da tabela de consignantes (desktop): clicar abre os detalhes para baixo. */
export function ConsignmentRowItem({ row: r, grid }: { row: ConsignmentRow; grid: string }) {
  const [open, setOpen] = useState(false);
  const sold = r.status === "vendido";
  const phone = fmtPhone(r.phone);
  const digits = (r.phone ?? "").replace(/\D/g, "");
  const entered = r.consignado_date ?? r.created_at;
  const toggle = () => setOpen((o) => !o);

  return (
    <div className="bg-white">
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") toggle();
        }}
        className={`${grid} cursor-pointer px-4 py-3 transition-colors hover:bg-zinc-50`}
      >
        {/* nome (pontinho: verde = carro na loja, cinza = já vendido) */}
        <span className="flex min-w-0 items-center gap-2">
          <span
            title={sold ? "Carro já vendido" : "Carro na loja"}
            className={`size-2 shrink-0 rounded-full ${sold ? "bg-zinc-300" : "bg-emerald-500"}`}
          />
          <span className="truncate text-[13px] font-semibold text-zinc-900">{r.owner || "—"}</span>
          <ConsignorEditPencil row={r} />
        </span>
        <span className="min-w-0">
          {phone ? (
            <a
              href={`https://wa.me/55${digits}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 truncate text-[13px] text-zinc-600 hover:text-emerald-600"
            >
              <WhatsAppIcon size={12} className="shrink-0 text-emerald-500" />
              {phone}
            </a>
          ) : (
            <span className="text-[13px] text-zinc-400">—</span>
          )}
        </span>
        <span className="truncate text-[13px] font-medium tabular-nums text-zinc-800">
          {r.consignor_value != null ? brl(r.consignor_value) : "—"}
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <BrandLogo brand={r.brand} size={16} />
          <span className="truncate text-[13px] font-medium text-zinc-800">{r.label}</span>
        </span>
        <span className="truncate text-[13px] tabular-nums text-zinc-500">{enteredAt(r)}</span>
        <span className="flex items-center justify-end gap-1">
          {/* lixeira só para carro que ainda não foi vendido; cliques e teclas não vazam para a linha */}
          {!sold && r.sold_date == null && r.sold_price == null && (
            <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="-my-1.5 flex">
              <ConfirmButton
                action={deleteConsignment.bind(null, r.id)}
                title="Excluir este consignado?"
                description={`O ${r.label}${r.plate ? " (" + r.plate + ")" : ""} de ${r.owner} sai do sistema junto com custos, fotos, documentos, histórico e leads encerrados dele. Use se o dono levou o carro de volta ou se foi cadastro errado. Não dá para desfazer.`}
                variant="danger-ghost"
                className="size-9 p-0"
              >
                <Trash2 size={15} aria-hidden />
                <span className="sr-only">{`Excluir consignado de ${r.owner || r.label}`}</span>
              </ConfirmButton>
            </span>
          )}
          <ChevronRight size={15} className={`shrink-0 text-zinc-300 transition-transform ${open ? "rotate-90" : ""}`} />
        </span>
      </div>

      {open && (
        <div className="space-y-3 border-t border-zinc-100 bg-zinc-50/50 px-4 py-3.5">
          <div className="grid grid-cols-4 gap-x-4 gap-y-3">
            <Info label="CPF/CNPJ" value={fmtCpfCnpj(r.cpf)} />
            <Info label="E-mail" value={r.email} />
            <Info
              label="Placa"
              value={
                r.plate ? (
                  <span className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-zinc-600">
                    {r.plate}
                  </span>
                ) : null
              }
            />
            <Info
              label="Situação"
              value={
                sold
                  ? `Vendido${r.sold_date ? ` em ${fmtDay(r.sold_date)}` : ""}`
                  : `Na loja há ${daysSince(entered)} dia(s)`
              }
            />
            <Info label="Repasse combinado" value={r.consignor_value != null ? brl(r.consignor_value) : null} />
            <Info
              label={sold ? "Vendido por" : "Preço anunciado"}
              value={(sold ? r.sold_price : r.sale_price) != null ? brl((sold ? r.sold_price : r.sale_price)!) : null}
            />
            <Info
              label="Venda − repasse"
              value={
                r.consignor_value != null && (sold ? r.sold_price : r.sale_price) != null
                  ? brl((sold ? r.sold_price : r.sale_price)! - r.consignor_value)
                  : null
              }
            />
            <Info label="Entrou em" value={fmtDay(entered)} />
          </div>
          <Link
            href={`/veiculos/${r.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
          >
            <ExternalLink size={12} />
            Ver veículo
          </Link>
        </div>
      )}
    </div>
  );
}
