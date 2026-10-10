"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, Trash2 } from "lucide-react";
import { CustomerEditPencil } from "@/components/customers/customer-dialogs";
import { ConfirmButton } from "@/components/ui/confirm";
import { deleteBuyer } from "@/lib/actions/deals";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { BrandLogo } from "@/components/vehicles/brand-logo";
import { brl } from "@/lib/format";
import type { DealRow } from "@/lib/types";

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

/** "Hoje, 14:20" · "Ontem" · "05/10/2026, 10:05" — a hora vem do registro, quando foi no mesmo dia da venda. */
function soldAt(d: DealRow): string {
  const [createdDay, createdTime] = d.created_at.split(" ");
  const day = d.sold_date ?? createdDay!;
  const time = createdDay === day ? createdTime?.slice(0, 5) : undefined;
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = (x: Date) => `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const label = day === iso(today) ? "Hoje" : day === iso(yesterday) ? "Ontem" : fmtDay(day);
  return time ? `${label}, ${time}` : label;
}

function Info({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "emerald" | "red" | "amber" }) {
  const color = tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-zinc-900";
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-0.5 break-words text-[13px] font-medium ${color}`}>{value ?? "—"}</p>
    </div>
  );
}

/** Linha da tabela de compradores (desktop): uma venda; clicar abre os detalhes para baixo. */
export function BuyerRowItem({ deal: d, grid }: { deal: DealRow; grid: string }) {
  const [open, setOpen] = useState(false);
  const phone = fmtPhone(d.customer_phone);
  const digits = (d.customer_phone ?? "").replace(/\D/g, "");
  const profit = d.sale_price != null ? d.sale_price - d.vehicle_total_cost : null;
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
        {/* nome (pontinho: verde = tudo recebido, âmbar = ainda falta receber) */}
        <span className="flex min-w-0 items-center gap-2">
          <span
            title={d.pending > 0 ? `Falta receber ${brl(d.pending)}` : "Venda recebida"}
            className={`size-2 shrink-0 rounded-full ${d.pending > 0 ? "bg-amber-400" : "bg-emerald-500"}`}
          />
          <span className="truncate text-[13px] font-semibold text-zinc-900">{d.customer_name}</span>
          <CustomerEditPencil
            customer={{
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
            }}
          />
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
          {d.sale_price != null ? brl(d.sale_price) : "—"}
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <BrandLogo brand={d.vehicle_brand} size={16} />
          <span className="truncate text-[13px] font-medium text-zinc-800">{d.vehicle_label}</span>
        </span>
        <span className="truncate text-[13px] tabular-nums text-zinc-500">{soldAt(d)}</span>
        <span className="flex items-center justify-end gap-1">
          {/* lixeira: desfaz a venda; cliques e teclas não vazam para a linha */}
          <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="-my-1.5 flex">
            <ConfirmButton
              action={deleteBuyer.bind(null, d.id)}
              title="Excluir este comprador?"
              description={`A venda do ${d.vehicle_label} para ${d.customer_name} será desfeita: o carro volta para o estoque e os recebimentos dessa venda são apagados. Não dá para desfazer.`}
              variant="danger-ghost"
              className="size-9 p-0"
            >
              <Trash2 size={15} aria-hidden />
              <span className="sr-only">{`Excluir comprador ${d.customer_name}`}</span>
            </ConfirmButton>
          </span>
          <ChevronRight size={15} className={`shrink-0 text-zinc-300 transition-transform ${open ? "rotate-90" : ""}`} />
        </span>
      </div>

      {open && (
        <div className="space-y-3 border-t border-zinc-100 bg-zinc-50/50 px-4 py-3.5">
          <div className="grid grid-cols-4 gap-x-4 gap-y-3">
            <Info label="CPF/CNPJ" value={fmtCpfCnpj(d.customer_cpf)} />
            <Info label="E-mail" value={d.customer_email} />
            <Info
              label="Placa"
              value={
                d.vehicle_plate ? (
                  <span className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-zinc-600">
                    {d.vehicle_plate}
                  </span>
                ) : null
              }
            />
            <Info label="Canal de venda" value={d.channel} />
            <Info label="Custo do carro" value={brl(d.vehicle_total_cost)} />
            <Info
              label="Lucro"
              value={profit != null ? brl(profit) : null}
              tone={profit == null ? undefined : profit >= 0 ? "emerald" : "red"}
            />
            <Info label="Recebido" value={brl(d.received)} tone="emerald" />
            <Info label="A receber" value={d.pending > 0 ? brl(d.pending) : "Nada"} tone={d.pending > 0 ? "amber" : undefined} />
          </div>
          <Link
            href={`/veiculos/${d.vehicle_id}`}
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
