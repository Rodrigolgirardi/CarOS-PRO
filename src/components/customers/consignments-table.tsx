import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { LeadSearch } from "@/components/deals/lead-search";
import { LinkButton } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { BrandLogo } from "@/components/vehicles/brand-logo";
import { brl } from "@/lib/format";
import { listConsignments, type ConsignmentRow } from "@/lib/queries/vehicles";

// mesma grade da tabela de leads, para as duas abas terem o mesmo desenho
const GRID = "grid grid-cols-[1.4fr_1fr_0.9fr_1.6fr_0.9fr_16px] items-center gap-4";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function fmtPhone(raw: string | null): string | null {
  const d = (raw ?? "").replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw || null;
}

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
  const label =
    day === iso(today) ? "Hoje" : day === iso(yesterday) ? "Ontem" : `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;
  return time ? `${label}, ${time}` : label;
}

/** Aba Consignantes no desktop: mesmo desenho da tabela de leads, uma linha por carro consignado. */
export async function ConsignmentsTable({ busca }: { busca?: string }) {
  const all = await listConsignments();
  const q = busca?.trim() ? norm(busca.trim()) : null;
  const qDigits = q ? q.replace(/\D/g, "") : "";
  const rows = q
    ? all.filter(
        (r) =>
          norm(r.owner).includes(q) ||
          norm(r.label).includes(q) ||
          (qDigits !== "" && (r.phone ?? "").replace(/\D/g, "").includes(qDigits))
      )
    : all;

  return (
    <div className="space-y-4 lg:mx-auto lg:max-w-5xl">
      <div className="flex items-center gap-2">
        <LinkButton href="/compras/nova?tipo=consignado" variant="primary">
          <Plus size={14} />
          Novo consignado
        </LinkButton>
        <div className="min-w-0 flex-1">
          <LeadSearch busca={busca ?? null} tab="consignantes" placeholder="Buscar por dono, telefone ou veículo…" />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 px-6 py-10 text-center text-[13px] text-zinc-500">
          {q ? "Nenhum consignado encontrado para essa busca." : "Nenhum carro consignado ainda."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className={`${GRID} border-b border-zinc-200 bg-zinc-50/60 px-4 py-2 text-xs font-medium text-zinc-500`}>
            <span>Nome do proprietário</span>
            <span>Contato</span>
            <span>Repasse combinado</span>
            <span>Veículo da pessoa</span>
            <span>Data/hora que deixou</span>
            <span />
          </div>
          <div className="divide-y divide-zinc-100">
            {rows.map((r) => {
              const sold = r.status === "vendido";
              const phone = fmtPhone(r.phone);
              const digits = (r.phone ?? "").replace(/\D/g, "");
              return (
                <div key={r.id} className={`${GRID} px-4 py-3 transition-colors hover:bg-zinc-50`}>
                  {/* nome (pontinho: verde = carro na loja, cinza = já vendido) */}
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      title={sold ? "Carro já vendido" : "Carro na loja"}
                      className={`size-2 shrink-0 rounded-full ${sold ? "bg-zinc-300" : "bg-emerald-500"}`}
                    />
                    <span className="truncate text-[13px] font-semibold text-zinc-900">{r.owner || "—"}</span>
                  </span>
                  <span className="min-w-0">
                    {phone ? (
                      <a
                        href={`https://wa.me/55${digits}`}
                        target="_blank"
                        rel="noreferrer"
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
                  <Link
                    href={`/veiculos/${r.id}`}
                    className="flex min-w-0 items-center gap-2 underline-offset-2 hover:underline"
                  >
                    <BrandLogo brand={r.brand} size={16} />
                    <span className="truncate text-[13px] font-medium text-zinc-800">{r.label}</span>
                  </Link>
                  <span className="truncate text-[13px] tabular-nums text-zinc-500">{enteredAt(r)}</span>
                  <Link href={`/veiculos/${r.id}`} aria-label="Abrir veículo" className="text-zinc-300 hover:text-zinc-600">
                    <ChevronRight size={15} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
