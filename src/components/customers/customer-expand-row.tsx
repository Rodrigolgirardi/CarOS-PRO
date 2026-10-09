"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { CustomerRowActions } from "@/components/customers/customer-dialogs";
import { CustomerStatusBadge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/vehicles/brand-logo";
import { CUSTOMER_KIND } from "@/lib/labels";
import type { CustomerListRow } from "@/lib/queries/customers";

/** (11) 99999-0000 a partir de qualquer jeito que o número foi digitado. */
function fmtPhone(raw: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
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

/** Linha de cliente que expande para baixo com os detalhes. */
export function CustomerExpandRow({
  customer: c,
  consignorView,
  buyerView,
}: {
  customer: CustomerListRow;
  /**
   * Abas Consignantes/Compradores: no desktop mostra o carro (deixado na loja
   * ou comprado) no lugar do rótulo do tipo de cliente.
   */
  consignorView?: boolean;
  buyerView?: boolean;
}) {
  const carsView = consignorView || buyerView;
  const cars = ((buyerView ? c.bought_vehicles : c.consigned_vehicles) ?? "")
    .split("|")
    .filter(Boolean)
    .map((x) => {
      const [id, brand, ...label] = x.split("~");
      return { id: Number(id), brand, label: label.join("~") };
    });
  const [open, setOpen] = useState(false);
  // alguns cadastros antigos têm o telefone embutido no nome — separa na exibição
  const embedded = !c.phone ? c.name.match(/^(.*?)[\s—–-]*(\(?\d{2}\)?[\s.-]?9?[\s.-]?\d{4}[\s.-]?\d{4})\s*$/) : null;
  const displayName = embedded ? embedded[1].trim() || c.name : c.name;
  const displayPhone = fmtPhone(c.phone ?? embedded?.[2] ?? null);
  const phoneDigits = (displayPhone ?? "").replace(/\D/g, "");
  // na linha, só o número local (9 dígitos), sem DDD — o completo fica no perfil
  const shortPhone =
    phoneDigits.length >= 10 ? `${phoneDigits.slice(2, -4)}-${phoneDigits.slice(-4)}` : displayPhone;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((o) => !o);
        }}
        className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-50"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-medium text-zinc-900">{displayName}</span>
          {displayPhone && (
            <>
              <span className="shrink-0 text-zinc-200">|</span>
              <a
                href={`https://wa.me/55${phoneDigits}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex shrink-0 items-center gap-1 text-xs text-zinc-500 hover:text-emerald-600"
              >
                <WhatsAppIcon size={12} className="text-emerald-500" />
                {shortPhone}
              </a>
            </>
          )}
          {carsView &&
            cars.map((car) => (
              <span key={car.id} className="hidden min-w-0 items-center gap-2 lg:flex">
                <span className="shrink-0 text-zinc-200">|</span>
                <a
                  href={`/veiculos/${car.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:underline hover:underline-offset-2"
                >
                  <BrandLogo brand={car.brand} size={16} />
                  <span className="truncate">{car.label}</span>
                </a>
              </span>
            ))}
          <span className={`shrink-0 text-zinc-200 ${carsView ? "lg:hidden" : ""}`}>|</span>
          <span
            className={`shrink-0 text-xs font-medium ${carsView ? "lg:hidden" : ""} ${
              c.kind === "consignante" ? "text-violet-600" : "text-emerald-600"
            }`}
          >
            {CUSTOMER_KIND[c.kind].label}
          </span>
        </span>
        <ChevronRight size={15} className={`shrink-0 text-zinc-300 transition-transform ${open ? "rotate-90" : ""}`} />
      </div>

      {open && (
        <div className="space-y-3 border-t border-zinc-100 bg-zinc-50/50 px-4 py-3.5">
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">
            <Info label="Telefone" value={displayPhone} />
            <Info label="E-mail" value={c.email} />
            <Info label="Cidade" value={c.city} />
            <Info label="CPF/CNPJ" value={fmtCpfCnpj(c.cpf_cnpj)} />
            <Info label="Status" value={<CustomerStatusBadge status={c.status} />} />
            <Info label="Compras" value={c.purchases_count || "—"} />
            {c.active_interest && <Info label="Interesse atual" value={c.active_interest} />}
          </div>
          {c.notes && (
            <p className="rounded-lg bg-white px-3 py-2 text-[13px] leading-relaxed text-zinc-600">{c.notes}</p>
          )}
          <div className="flex justify-end">
            <CustomerRowActions customer={c} />
          </div>
        </div>
      )}
    </div>
  );
}
