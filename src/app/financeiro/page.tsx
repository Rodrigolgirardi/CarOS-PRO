import Link from "next/link";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CashflowChart } from "@/components/finance/cashflow-chart";
import { NewPayableButton, NewReceivableButton } from "@/components/finance/finance-dialogs";
import { MonthSelect } from "@/components/finance/month-select";
import { BrandLogo } from "@/components/vehicles/brand-logo";
import { ExtractFilters } from "@/components/finance/extract-filters";
import { ActionButton } from "@/components/ui/action-button";
import { Badge, VehicleStatusBadge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm";
import { Stat, StatGrid } from "@/components/ui/stat";
import { Chips, LinkTabs } from "@/components/ui/tabs";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { deleteCashEntry, deletePayable, deleteReceivable, togglePayable, toggleReceivable } from "@/lib/actions/finance";
import { addDaysISO, brl, daysUntil, fmtDate, monthStartISO, todayISO } from "@/lib/format";
import { customerOptions } from "@/lib/queries/customers";
import { cashflow, dreData, listPayables, listReceivables, openTotals, type FinanceStatusFilter } from "@/lib/queries/finance";
import { vehicleOptions } from "@/lib/queries/vehicles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Financeiro" };

const PERIODS = [
  { key: "hoje", label: "Hoje" },
  { key: "7", label: "7 dias" },
  { key: "30", label: "30 dias" },
  { key: "mes", label: "Mês atual" },
] as const;

function periodFrom(key: string): string | null {
  if (key === "hoje") return todayISO();
  if (key === "7") return addDaysISO(todayISO(), -7);
  if (key === "mes") return monthStartISO();
  return addDaysISO(todayISO(), -30);
}

const KIND_LABEL: Record<string, { label: string; tone: "emerald" | "blue" | "amber" | "red" | "zinc" }> = {
  recebimento: { label: "Recebimento", tone: "emerald" },
  compra: { label: "Compra", tone: "blue" },
  custo: { label: "Custo", tone: "amber" },
  conta: { label: "Conta paga", tone: "red" },
};

function DueCell({ due, pending }: { due: string; pending: boolean }) {
  const overdue = pending && daysUntil(due) < 0;
  const soon = pending && !overdue && daysUntil(due) <= 3;
  return (
    <span className={overdue ? "font-medium text-red-600" : soon ? "font-medium text-amber-600" : "text-zinc-500"}>
      {fmtDate(due)}
      {overdue && " · vencida"}
    </span>
  );
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    periodo?: string;
    status?: string;
    mes?: string;
    data?: string;
    veiculo?: string;
    busca?: string;
  }>;
}) {
  const sp = await searchParams;
  const tab = ["caixa", "dre", "pagar", "receber"].includes(sp.tab ?? "") ? sp.tab! : "caixa";
  const periodo = PERIODS.some((p) => p.key === sp.periodo) ? sp.periodo! : "30";

  // filtro por mês fechado: mês + ano (2026 em diante, acompanhando o calendário)
  const MESES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: Math.max(1, currentYear - 2026 + 1) }, (_, i) => 2026 + i);
  const mesValido =
    !!sp.mes &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.mes) &&
    Number(sp.mes.slice(0, 4)) >= 2026 &&
    Number(sp.mes.slice(0, 4)) <= currentYear;
  const mes = mesValido ? sp.mes! : null;
  const mesLabel = mes ? `${MESES[Number(mes.slice(5, 7)) - 1]}/${mes.slice(0, 4)}` : null;
  const statusFilter: FinanceStatusFilter = ["pendentes", "resolvidas", "todas"].includes(sp.status ?? "")
    ? (sp.status as FinanceStatusFilter)
    : "pendentes";

  const totals = openTotals();
  const vehicles = vehicleOptions({ includeSold: true });
  const customers = customerOptions();

  const tabHref = (t: string) => `/financeiro?tab=${t}`;

  return (
    <>
      <PageHeader title="Financeiro" description="Caixa, contas a pagar e contas a receber — tudo ligado às operações." />

      <LinkTabs
        className="mb-5"
        activeKey={tab}
        tabs={[
          { key: "caixa", label: "Fluxo de caixa", href: tabHref("caixa") },
          { key: "dre", label: "DRE", href: tabHref("dre") },
        ]}
      />

      {tab === "caixa" && (() => {
        const monthEnd = mes
          ? `${mes}-${String(new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0).getDate()).padStart(2, "0")}`
          : null;
        // data exata ignora os períodos; carro/placa filtram por cima de qualquer recorte
        const dia = sp.data && /^\d{4}-\d{2}-\d{2}$/.test(sp.data) ? sp.data : null;
        const veiculoId = sp.veiculo && /^\d+$/.test(sp.veiculo) ? Number(sp.veiculo) : null;
        const norm = (s: string) =>
          s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
        const busca = sp.busca?.trim() ? norm(sp.busca.trim()) : null;
        const buscaPlaca = busca ? busca.replace(/[^a-z0-9]/g, "") : null;
        const flow = dia ? cashflow(dia, dia) : mes ? cashflow(`${mes}-01`, monthEnd) : cashflow(periodFrom(periodo));
        const entries = flow.entries.filter((e) => {
          if (veiculoId && e.vehicle_id !== veiculoId) return false;
          if (!busca) return true;
          const plate = (e.vehicle_plate ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
          return (
            norm(e.description).includes(busca) ||
            norm(e.vehicle_label ?? "").includes(busca) ||
            (!!buscaPlaca && plate.includes(buscaPlaca))
          );
        });
        const inflow = entries.reduce((s, e) => s + e.inflow, 0);
        const outflow = entries.reduce((s, e) => s + e.outflow, 0);
        const periodSub = dia ? fmtDate(dia) : (mesLabel ?? "No período");
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Chips
                activeKey={mes || dia ? "" : periodo}
                items={PERIODS.map((p) => ({ key: p.key, label: p.label, href: `/financeiro?tab=caixa&periodo=${p.key}` }))}
              />
              <MonthSelect years={years} active={mes} />
            </div>
            <StatGrid className="grid-cols-2 md:grid-cols-4">
              <Stat
                label="Saldo em caixa"
                value={brl(flow.balance)}
                valueClassName={flow.balance >= 0 ? undefined : "text-red-600"}
                sub="Todo o histórico"
              />
              <Stat label="Entradas" value={brl(inflow)} valueClassName="text-emerald-600" sub={periodSub} />
              <Stat label="Saídas" value={brl(outflow)} valueClassName="text-red-600" sub={periodSub} />
              <Stat
                label="Resultado"
                value={brl(inflow - outflow)}
                valueClassName={inflow - outflow >= 0 ? "text-emerald-600" : "text-red-600"}
                sub="Entradas − saídas"
              />
            </StatGrid>

            <CashflowChart months={flow.monthly} />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[13px] font-semibold text-zinc-900">Extrato</h2>
              <ExtractFilters vehicles={vehicles} data={dia} veiculo={veiculoId ? String(veiculoId) : null} busca={sp.busca ?? null} />
            </div>

            {entries.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-6 py-10 text-center text-[13px] text-zinc-400">
                Nenhuma movimentação para esse filtro.
              </p>
            ) : (
              <Table>
                <THead>
                  <Th>Data</Th>
                  <Th>Carro</Th>
                  <Th>Placa</Th>
                  <Th>Descrição</Th>
                  <Th>Tipo</Th>
                  <Th right>Entrada</Th>
                  <Th right>Saída</Th>
                  <Th />
                </THead>
                <TBody>
                  {entries.map((e, i) => {
                    const kind = KIND_LABEL[e.kind] ?? KIND_LABEL.conta;
                    return (
                      <Tr key={`${e.kind}-${i}`}>
                        <Td className="text-zinc-500">{fmtDate(e.date)}</Td>
                        <Td className="max-w-[200px]">
                          {e.vehicle_label ? (
                            <Link
                              href={e.href ?? "#"}
                              className="flex items-center gap-1.5 underline-offset-2 hover:underline"
                            >
                              <BrandLogo brand={e.vehicle_label} size={14} />
                              <span className="truncate font-medium text-zinc-800">{e.vehicle_label}</span>
                            </Link>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </Td>
                        <Td>
                          {e.vehicle_plate ? (
                            <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[11px] text-zinc-600">
                              {e.vehicle_plate}
                            </span>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </Td>
                        <Td className="max-w-[280px]">
                          <span className="block truncate text-zinc-800">{e.description}</span>
                        </Td>
                        <Td>
                          <Badge tone={kind.tone}>{kind.label}</Badge>
                        </Td>
                        <Td right className="font-medium text-emerald-600">
                          {e.inflow > 0 ? brl(e.inflow) : ""}
                        </Td>
                        <Td right className="font-medium text-red-600">
                          {e.outflow > 0 ? `− ${brl(e.outflow)}` : ""}
                        </Td>
                        <Td right className="w-10">
                          {e.kind !== "compra" && (
                            <ConfirmButton
                              action={deleteCashEntry.bind(null, e.kind, e.source_id)}
                              title="Excluir transação?"
                              description={`"${e.description}" (${brl(e.inflow || e.outflow)}) será apagada do caixa e de onde estiver ligada. Não dá para desfazer.`}
                              variant="danger-ghost"
                              className="size-9 p-0"
                            >
                              <Trash2 size={21} />
                            </ConfirmButton>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </div>
        );
      })()}

      {tab === "dre" && (() => {
        const dre = dreData();
        const sold = dre.filter((d) => d.sold);
        const stock = dre.filter((d) => !d.sold);
        const revenue = sold.reduce((s, d) => s + (d.sale ?? 0), 0);
        const profitReal = sold.reduce((s, d) => s + (d.profit ?? 0), 0);
        const profitPot = stock.reduce((s, d) => s + (d.profit ?? 0), 0);

        const Card = ({ d }: { d: (typeof dre)[number] }) => (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
              <div className="min-w-0">
                <Link
                  href={`/veiculos/${d.id}`}
                  className="block truncate text-[13px] font-semibold text-zinc-900 underline-offset-2 hover:underline"
                >
                  {d.label}
                </Link>
                {d.plate && (
                  <span className="mt-0.5 inline-block rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                    {d.plate}
                  </span>
                )}
              </div>
              <VehicleStatusBadge status={d.status} />
            </div>
            <dl className="space-y-1 px-4 py-3 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500">Preço de compra</dt>
                <dd className="font-medium tabular-nums text-red-600">− {brl(d.purchase)}</dd>
              </div>
              {d.costs.map((c) => (
                <div key={c.category} className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500">{c.label}</dt>
                  <dd className="font-medium tabular-nums text-red-600">− {brl(c.total)}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500">{d.sold ? "Valor de venda" : "Venda prevista (anúncio)"}</dt>
                <dd className={`font-medium tabular-nums ${d.sale != null ? "text-emerald-600" : "text-zinc-300"}`}>
                  {d.sale != null ? `+ ${brl(d.sale)}` : "sem preço"}
                </dd>
              </div>
              <div className="!mt-2.5 flex items-center justify-between gap-3 border-t border-zinc-100 pt-2.5">
                <dt className="font-semibold text-zinc-900">{d.profit != null && d.profit < 0 ? "Prejuízo" : "Lucro"}</dt>
                <dd
                  className={`text-sm font-semibold tabular-nums ${
                    d.profit == null ? "text-zinc-300" : d.profit >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {d.profit == null ? "—" : brl(d.profit)}
                </dd>
              </div>
            </dl>
          </div>
        );

        return (
          <div className="space-y-6">
            <StatGrid className="grid-cols-2 md:grid-cols-4">
              <Stat label="Receita realizada" value={brl(revenue)} sub={`${sold.length} veículo(s) vendido(s)`} />
              <Stat
                label="Lucro realizado"
                value={brl(profitReal)}
                valueClassName={profitReal >= 0 ? "text-emerald-600" : "text-red-600"}
                sub="Vendas concluídas"
              />
              <Stat
                label="Lucro potencial"
                value={brl(profitPot)}
                valueClassName={profitPot >= 0 ? "text-emerald-600" : "text-red-600"}
                sub="Estoque atual"
              />
              <Stat
                label="Resultado total"
                value={brl(profitReal + profitPot)}
                valueClassName={profitReal + profitPot >= 0 ? "text-emerald-600" : "text-red-600"}
                sub="Realizado + potencial"
              />
            </StatGrid>

            {stock.length > 0 && (
              <section>
                <h2 className="mb-2.5 text-[13px] font-semibold text-zinc-900">Em estoque — resultado potencial</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {stock.map((d) => (
                    <Card key={d.id} d={d} />
                  ))}
                </div>
              </section>
            )}

            {sold.length > 0 && (
              <section>
                <h2 className="mb-2.5 text-[13px] font-semibold text-zinc-900">Vendidos — resultado realizado</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {sold.map((d) => (
                    <Card key={d.id} d={d} />
                  ))}
                </div>
              </section>
            )}

            {dre.length === 0 && (
              <p className="rounded-xl border border-dashed border-zinc-200 px-6 py-10 text-center text-[13px] text-zinc-400">
                A DRE aparece aqui conforme você registra compras, custos e vendas.
              </p>
            )}
          </div>
        );
      })()}

      {tab === "pagar" && (() => {
        const rows = listPayables(statusFilter);
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Chips
                activeKey={statusFilter}
                items={[
                  { key: "pendentes", label: "Pendentes", count: totals.payablesCount, href: "/financeiro?tab=pagar" },
                  { key: "resolvidas", label: "Pagas", href: "/financeiro?tab=pagar&status=resolvidas" },
                  { key: "todas", label: "Todas", href: "/financeiro?tab=pagar&status=todas" },
                ]}
              />
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-zinc-500">
                  Pendente: <strong className="font-semibold text-zinc-900 tabular-nums">{brl(totals.payables)}</strong>
                </span>
                <NewPayableButton vehicles={vehicles} />
              </div>
            </div>

            {rows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-6 py-10 text-center text-[13px] text-zinc-400">
                Nenhuma conta aqui. 🎉
              </p>
            ) : (
              <Table>
                <THead>
                  <Th>Vencimento</Th>
                  <Th>Descrição</Th>
                  <Th>Categoria</Th>
                  <Th>Veículo</Th>
                  <Th right>Valor</Th>
                  <Th>Status</Th>
                  <Th />
                </THead>
                <TBody>
                  {rows.map((p) => (
                    <Tr key={p.id}>
                      <Td>
                        <DueCell due={p.due_date} pending={p.status === "pendente"} />
                      </Td>
                      <Td className="max-w-[280px] truncate font-medium text-zinc-800">{p.description}</Td>
                      <Td>{p.category ? <Badge>{p.category}</Badge> : <span className="text-zinc-300">—</span>}</Td>
                      <Td className="max-w-[180px] truncate">
                        {p.vehicle_id ? (
                          <Link href={`/veiculos/${p.vehicle_id}`} className="text-zinc-600 underline-offset-2 hover:underline">
                            {p.vehicle_label}
                          </Link>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </Td>
                      <Td right className="font-medium">
                        {brl(p.amount)}
                      </Td>
                      <Td>
                        <Badge tone={p.status === "pago" ? "emerald" : "amber"} dot>
                          {p.status === "pago" ? "Paga" : "Pendente"}
                        </Badge>
                      </Td>
                      <Td className="w-[180px]">
                        <div className="flex items-center justify-end gap-1">
                          <ActionButton action={togglePayable.bind(null, p.id)} variant="secondary" size="sm">
                            {p.status === "pendente" ? "Marcar paga" : "Desfazer"}
                          </ActionButton>
                          <ConfirmButton
                            action={deletePayable.bind(null, p.id)}
                            title="Excluir conta?"
                            description={`"${p.description}" será removida.`}
                            variant="danger-ghost"
                            className="size-8 p-0"
                          >
                            <Trash2 size={16} />
                          </ConfirmButton>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        );
      })()}

      {tab === "receber" && (() => {
        const rows = listReceivables(statusFilter);
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Chips
                activeKey={statusFilter}
                items={[
                  { key: "pendentes", label: "Pendentes", count: totals.receivablesCount, href: "/financeiro?tab=receber" },
                  { key: "resolvidas", label: "Recebidas", href: "/financeiro?tab=receber&status=resolvidas" },
                  { key: "todas", label: "Todas", href: "/financeiro?tab=receber&status=todas" },
                ]}
              />
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-zinc-500">
                  A receber: <strong className="font-semibold text-zinc-900 tabular-nums">{brl(totals.receivables)}</strong>
                </span>
                <NewReceivableButton customers={customers} />
              </div>
            </div>

            {rows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-6 py-10 text-center text-[13px] text-zinc-400">
                Nenhuma conta aqui.
              </p>
            ) : (
              <Table>
                <THead>
                  <Th>Vencimento</Th>
                  <Th>Descrição</Th>
                  <Th>Cliente</Th>
                  <Th>Origem</Th>
                  <Th right>Valor</Th>
                  <Th>Status</Th>
                  <Th />
                </THead>
                <TBody>
                  {rows.map((r) => (
                    <Tr key={r.id}>
                      <Td>
                        <DueCell due={r.due_date} pending={r.status === "pendente"} />
                      </Td>
                      <Td className="max-w-[280px] truncate font-medium text-zinc-800">{r.description}</Td>
                      <Td className="max-w-[160px] truncate">
                        {r.customer_id ? (
                          <Link href={`/clientes/${r.customer_id}`} className="text-zinc-600 underline-offset-2 hover:underline">
                            {r.customer_name}
                          </Link>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </Td>
                      <Td>
                        {r.deal_id ? (
                          <Badge tone="blue">Venda</Badge>
                        ) : (
                          <Badge>Avulsa</Badge>
                        )}
                      </Td>
                      <Td right className="font-medium">
                        {brl(r.amount)}
                      </Td>
                      <Td>
                        <Badge tone={r.status === "recebido" ? "emerald" : "amber"} dot>
                          {r.status === "recebido" ? "Recebida" : "Pendente"}
                        </Badge>
                      </Td>
                      <Td className="w-[200px]">
                        <div className="flex items-center justify-end gap-1">
                          <ActionButton
                            action={toggleReceivable.bind(null, r.id)}
                            variant={r.status === "pendente" ? "primary" : "secondary"}
                            size="sm"
                          >
                            {r.status === "pendente" ? "Registrar recebimento" : "Desfazer"}
                          </ActionButton>
                          <ConfirmButton
                            action={deleteReceivable.bind(null, r.id)}
                            title="Excluir conta?"
                            description={`"${r.description}" será removida.`}
                            variant="danger-ghost"
                            className="size-8 p-0"
                          >
                            <Trash2 size={16} />
                          </ConfirmButton>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        );
      })()}
    </>
  );
}
