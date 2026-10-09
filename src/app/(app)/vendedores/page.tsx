import { Percent } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AddRuleButton } from "@/components/commissions/add-rule-button";
import { CommissionRuleRow } from "@/components/commissions/rule-row";
import { SellerCreateButton, SellerRowActions } from "@/components/sellers/seller-dialogs";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { brl } from "@/lib/format";
import { listCommissionRules } from "@/lib/queries/commissions";
import { listSellers } from "@/lib/queries/sellers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendedores" };

function fmtPhone(raw: string | null): string | null {
  const d = (raw ?? "").replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw || null;
}

const fmtDay = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

function daysSince(iso: string): number {
  const start = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / 86_400_000));
}

export default async function SellersPage() {
  const [sellers, rules] = await Promise.all([listSellers(), listCommissionRules()]);

  return (
    <div className="lg:mx-auto lg:max-w-4xl">
      <PageHeader
        title="Vendedores"
        description={
          <>
            <span className="lg:hidden">
              Quem vende na sua loja, a comissão de cada um e os valores padrão por tipo de operação.
            </span>
            <span className="hidden lg:inline">
              Quem vende na sua loja. Os valores de comissão ficam em Configurações → Comissões.
            </span>
          </>
        }
        actions={<SellerCreateButton />}
      />

      {sellers.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="Nenhum vendedor cadastrado"
          description="Cadastre os vendedores e a % padrão de comissão. Ao registrar uma venda pelo botão Venda, a comissão é sugerida automaticamente."
          action={<SellerCreateButton />}
        />
      ) : (
        <>
          {/* desktop: Vendedor | Contato | Vendas | Tempo de casa */}
          <div className="hidden lg:block">
            <Table>
              <THead>
                <Th>Vendedor</Th>
                <Th className="text-center!">Contato</Th>
                <Th className="text-center!">Quantidade de vendas</Th>
                <Th className="text-center!">Vendedor há</Th>
                <Th />
              </THead>
              <TBody>
                {sellers.map((s) => {
                  const phone = fmtPhone(s.phone);
                  const since = s.start_date ?? s.created_at.slice(0, 10);
                  const days = daysSince(since);
                  return (
                    <Tr key={s.id}>
                      <Td className="font-medium text-zinc-900">{s.name}</Td>
                      <Td className="text-center">
                        {phone ? (
                          <a
                            href={`https://wa.me/55${(s.phone ?? "").replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-zinc-600 hover:text-emerald-600"
                          >
                            <WhatsAppIcon size={12} className="text-emerald-500" />
                            {phone}
                          </a>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </Td>
                      <Td className="text-center font-medium tabular-nums text-zinc-900">
                        {s.sales_count}
                      </Td>
                      <Td className="text-center text-zinc-600">
                        <span className="font-medium tabular-nums text-zinc-900">
                          {days} dia{days === 1 ? "" : "s"}
                        </span>{" "}
                        <span className="text-xs text-zinc-500">· desde {fmtDay(since)}</span>
                      </Td>
                      <Td className="w-20">
                        <SellerRowActions seller={s} />
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          </div>

          {/* celular: como era (comissão padrão, vendas e comissão acumulada) */}
          <div className="max-w-xl lg:hidden">
            <Table>
              <THead>
                <Th>Vendedor</Th>
                <Th right>Comissão padrão</Th>
                <Th right>Vendas</Th>
                <Th right>Comissão acumulada</Th>
                <Th />
              </THead>
              <TBody>
                {sellers.map((s) => (
                  <Tr key={s.id}>
                    <Td className="font-medium text-zinc-900">{s.name}</Td>
                    <Td right className="tabular-nums text-zinc-600">
                      {s.commission_fixed != null
                        ? `${brl(s.commission_fixed)} por venda`
                        : s.commission_pct != null
                          ? `${String(s.commission_pct).replace(".", ",")}%`
                          : "—"}
                    </Td>
                    <Td right className="tabular-nums text-zinc-600">
                      {s.sales_count}
                    </Td>
                    <Td right className="font-medium tabular-nums text-zinc-900">
                      {brl(s.commission_total)}
                    </Td>
                    <Td className="w-20">
                      <SellerRowActions seller={s} />
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </div>
        </>
      )}

      {/* celular: comissões continuam aqui; no desktop elas ficam em Configurações → Comissões */}
      <section className="mt-8 max-w-xl lg:hidden">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold text-zinc-900">Comissões padrão por operação</h2>
          <AddRuleButton />
        </div>
        <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white shadow-card">
          {rules.map((rule) => (
            <CommissionRuleRow key={rule.key} rule={rule} />
          ))}
        </div>
      </section>
    </div>
  );
}
