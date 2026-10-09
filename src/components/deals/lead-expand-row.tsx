"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, FileText, Pencil } from "lucide-react";
import { saveCustomer } from "@/lib/actions/customers";
import { CustomerFields } from "@/components/customers/customer-dialogs";
import { UploadDocButton } from "@/components/documents/upload-doc-button";
import { Badge, CustomerStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { BrandLogo } from "@/components/vehicles/brand-logo";
import { brl } from "@/lib/format";
import { CUSTOMER_KIND, DOC_TYPE, type Tone } from "@/lib/labels";
import type { Customer, DealRow, DealStage, DocRow } from "@/lib/types";

/** Como cada estágio aparece no CRM de leads. */
const LEAD_STAGE: Record<DealStage, { label: string; tone: Tone }> = {
  interessado: { label: "Em atendimento", tone: "emerald" },
  proposta: { label: "Negociação", tone: "amber" },
  reservado: { label: "Reservado", tone: "blue" },
  vendido: { label: "Convertido", tone: "teal" },
  entregue: { label: "Convertido", tone: "teal" },
  perdido: { label: "Perdido", tone: "red" },
};

const AVATAR_TONES = [
  "bg-violet-50 text-violet-600",
  "bg-blue-50 text-blue-600",
  "bg-emerald-50 text-emerald-600",
  "bg-amber-50 text-amber-600",
  "bg-rose-50 text-rose-500",
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

function fmtPhone(raw: string | null): string {
  const d = (raw ?? "").replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw ?? "";
}

/** "Hoje, 14:20" · "Ontem, 18:40" · "05/10/2026" */
function relativeDate(createdAt: string): string {
  const [datePart, timePart] = createdAt.split(" ");
  const hhmm = timePart?.slice(0, 5);
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (datePart === iso(today)) return hhmm ? `Hoje, ${hhmm}` : "Hoje";
  if (datePart === iso(yesterday)) return hhmm ? `Ontem, ${hhmm}` : "Ontem";
  return `${datePart.slice(8, 10)}/${datePart.slice(5, 7)}/${datePart.slice(0, 4)}`;
}

/** Desktop: sempre data e hora — "Hoje, 14:20" · "05/10/2026, 09:15". */
function dateTime(createdAt: string): string {
  const rel = relativeDate(createdAt);
  const hhmm = createdAt.split(" ")[1]?.slice(0, 5);
  return rel.includes(",") || !hhmm ? rel : `${rel}, ${hhmm}`;
}

/** Colunas da tabela de leads no desktop (cabeçalho e linhas usam a mesma grade). */
export const LEAD_ROW_GRID = "grid grid-cols-[1.4fr_1fr_0.9fr_1.6fr_0.9fr_16px] items-center gap-4";

/** Cabeçalho da tabela de leads (desktop). */
export function LeadTableHeader() {
  return (
    <div className={`${LEAD_ROW_GRID} border-b border-zinc-200 bg-zinc-50/60 px-4 py-2 text-xs font-medium text-zinc-500`}>
      <span>Nome do lead</span>
      <span>Contato</span>
      <span>Canal do lead</span>
      <span>Veículo de interesse</span>
      <span>Data/hora do lead</span>
      <span />
    </div>
  );
}

/** CPF 000.000.000-00 · CNPJ 00.000.000/0000-00. */
function fmtCpfCnpj(raw: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return raw;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 break-words text-[13px] font-medium text-zinc-900">{value ?? "—"}</p>
    </div>
  );
}

/** Card de lead que expande os detalhes para baixo. */
export function LeadExpandRow({
  deal: d,
  docs = [],
  layout = "card",
}: {
  deal: DealRow;
  docs?: DocRow[];
  /** "row": linha de tabela (desktop) — "card": cartão (celular) */
  layout?: "card" | "row";
}) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { state, formAction } = useAction(saveCustomer.bind(null, d.customer_id), {
    onSuccess: () => setEditOpen(false),
  });
  const customer: Customer = {
    id: d.customer_id,
    name: d.customer_name,
    cpf_cnpj: d.customer_cpf,
    phone: d.customer_phone,
    email: d.customer_email,
    city: d.customer_city,
    notes: d.customer_notes,
    kind: d.customer_kind,
    source: d.customer_source,
    status: d.customer_status,
    is_demo: 0,
    created_at: "",
  };
  const stage = LEAD_STAGE[d.stage];
  const value = d.sale_price ?? d.proposed_price ?? d.vehicle_sale_price;
  const specs = [
    d.vehicle_year_fab
      ? `${String(d.vehicle_year_fab).slice(-2)}/${String(d.vehicle_year_model ?? d.vehicle_year_fab).slice(-2)}`
      : null,
    d.vehicle_transmission,
  ]
    .filter(Boolean)
    .join(" · ");
  const phoneDigits = (d.customer_phone ?? "").replace(/\D/g, "");
  const toggle = () => setOpen((o) => !o);
  const row = layout === "row";

  return (
    <div
      className={
        row
          ? "bg-white"
          : "rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:border-zinc-300"
      }
    >
      {row ? (
        <div
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") toggle();
          }}
          className={`${LEAD_ROW_GRID} cursor-pointer px-4 py-3 transition-colors hover:bg-zinc-50`}
        >
          {/* nome (o pontinho colorido é o status do lead) */}
          <span className="flex min-w-0 items-center gap-2">
            <span
              title={stage.label}
              className={`size-2 shrink-0 rounded-full ${
                {
                  emerald: "bg-emerald-500",
                  amber: "bg-amber-400",
                  blue: "bg-blue-500",
                  teal: "bg-teal-400",
                  red: "bg-red-500",
                  violet: "bg-violet-400",
                  zinc: "bg-zinc-400",
                }[stage.tone]
              }`}
            />
            <span className="truncate text-[13px] font-semibold text-zinc-900">{d.customer_name}</span>
            <button
              type="button"
              aria-label="Editar cliente"
              onClick={(e) => {
                e.stopPropagation();
                setEditOpen(true);
              }}
              className="grid size-6 shrink-0 place-items-center rounded-md text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
            >
              <Pencil size={13} />
            </button>
          </span>
          {/* contato */}
          <span className="min-w-0">
            {phoneDigits ? (
              <a
                href={`https://wa.me/55${phoneDigits}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 truncate text-[13px] text-zinc-600 hover:text-emerald-600"
              >
                <WhatsAppIcon size={12} className="shrink-0 text-emerald-500" />
                {fmtPhone(d.customer_phone)}
              </a>
            ) : (
              <span className="text-[13px] text-zinc-400">—</span>
            )}
          </span>
          {/* canal */}
          <span className="truncate text-[13px] text-zinc-700">{d.channel ?? d.customer_source ?? "—"}</span>
          {/* veículo de interesse */}
          <span className="flex min-w-0 items-center gap-2">
            <BrandLogo brand={d.vehicle_brand} size={16} />
            <span className="truncate text-[13px] font-medium text-zinc-800">{d.vehicle_label}</span>
          </span>
          {/* data/hora */}
          <span className="truncate text-[13px] tabular-nums text-zinc-500">{dateTime(d.created_at)}</span>
          <ChevronRight size={15} className={`text-zinc-300 transition-transform ${open ? "rotate-90" : ""}`} />
        </div>
      ) : (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((o) => !o);
        }}
        className="cursor-pointer p-3.5"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                AVATAR_TONES[d.id % AVATAR_TONES.length]
              }`}
            >
              {initials(d.customer_name)}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-zinc-900">{d.customer_name}</span>
                <button
                  type="button"
                  aria-label="Editar cliente"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditOpen(true);
                  }}
                  className="grid size-6 shrink-0 place-items-center rounded-md text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                >
                  <Pencil size={13} />
                </button>
              </span>
              {phoneDigits && (
                <a
                  href={`https://wa.me/55${phoneDigits}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500 hover:text-emerald-600"
                >
                  <WhatsAppIcon size={12} className="shrink-0 text-emerald-500" />
                  {fmtPhone(d.customer_phone)}
                </a>
              )}
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1">
            <Badge tone={stage.tone} dot className="px-1.5 py-0 text-[11px]">
              {stage.label}
            </Badge>
            <span className="text-[11px] text-zinc-500">{relativeDate(d.created_at)}</span>
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-2.5">
          <span className="flex min-w-0 items-center gap-2">
            <BrandLogo brand={d.vehicle_brand} size={18} />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-zinc-900">{d.vehicle_label}</span>
              {specs && <span className="block truncate text-[11px] text-zinc-500">{specs}</span>}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="text-right">
              <span className="block text-[11px] text-zinc-500">Valor de venda</span>
              <span className="block text-[13px] font-semibold tabular-nums text-zinc-900">
                {value != null ? brl(value) : "—"}
              </span>
            </span>
            <ChevronRight
              size={15}
              className={`shrink-0 text-zinc-300 transition-transform ${open ? "rotate-90" : ""}`}
            />
          </span>
        </div>
      </div>
      )}

      {open && (
        <div className="space-y-3 border-t border-zinc-100 bg-zinc-50/50 px-3.5 py-3.5">
          {/* ficha completa do cliente */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">
            <Info label="Plataforma" value={d.channel ?? d.customer_source} />
            <Info label="Cidade" value={d.customer_city} />
            <Info label="CPF/CNPJ" value={fmtCpfCnpj(d.customer_cpf)} />
            <Info label="Tipo" value={CUSTOMER_KIND[d.customer_kind].label} />
            <Info label="Status" value={<CustomerStatusBadge status={d.customer_status} />} />
            <Info label="Proposta" value={d.proposed_price != null ? brl(d.proposed_price) : "—"} />
          </div>
          {d.notes && (
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Observações do lead</p>
              <p className="rounded-lg bg-white px-3 py-2 text-[13px] leading-relaxed text-zinc-600">{d.notes}</p>
            </div>
          )}
          {d.customer_notes && (
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Sobre o cliente</p>
              <p className="rounded-lg bg-white px-3 py-2 text-[13px] leading-relaxed text-zinc-600">{d.customer_notes}</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <Link
              href={`/veiculos/${d.vehicle_id}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
            >
              <ExternalLink size={12} />
              Ver veículo
            </Link>
          </div>
        </div>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Ficha do cliente">
        <form action={formAction} className="space-y-4">
          <CustomerFields customer={customer} />
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
            <SubmitButton>Salvar</SubmitButton>
          </div>
        </form>
        {/* documentos do cliente: CNH, contrato, comprovantes… */}
        <div className="mt-5 border-t border-zinc-100 pt-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-zinc-700">Documentos</p>
            <div className="flex gap-1.5">
              <UploadDocButton customerId={d.customer_id} />
            </div>
          </div>
          {docs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-3 text-center text-xs text-zinc-500">
              Nenhum documento — CNH, contrato, comprovante…
            </p>
          ) : (
            <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
              {docs.map((doc) => (
                <a
                  key={doc.id}
                  href={`/api/uploads/${doc.file_name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-zinc-50"
                >
                  <FileText size={14} className="shrink-0 text-zinc-400" />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-800">{doc.name}</span>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-500">
                    {DOC_TYPE[doc.type]}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
