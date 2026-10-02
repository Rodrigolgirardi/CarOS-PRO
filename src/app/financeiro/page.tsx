import Link from "next/link";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { NewPayableButton, NewReceivableButton } from "@/components/finance/finance-dialogs";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm";
import { Stat, StatGrid } from "@/components/ui/stat";
import { Chips, LinkTabs } from "@/components/ui/tabs";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { deletePayable, deleteReceivable, togglePayable, toggleReceivable } from "@/lib/actions/finance";
import { addDaysISO, brl, daysUntil, fmtDate, monthStartISO, todayISO } from "@/lib/format";
import { customerOptions } from "@/lib/queries/customers";
import { cashflow, listPayables, listReceivables, openTotals, type FinanceStatusFilter } from "@/lib/queries/finance";
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
  searchParams: Promise<{ tab?: string; periodo?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const tab = ["caixa", "pagar", "receber"].includes(sp.tab ?? "") ? sp.tab! : "caixa";
  const periodo = PERIODS.some((p) => p.key === sp.periodo) ? sp.periodo! : "30";
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
          { key: "pagar", label: "Contas a pagar", count: totals.payablesCount, href: tabHref("pagar") },
          { key: "receber", label: "Contas a receber", count: totals.receivablesCount, href: tabHref("receber") },
        ]}
      />

      {tab === "caixa" && (() => {
        const flow = cashflow(periodFrom(periodo));
        return (
          <div className="space-y-4">
            <Chips
              activeKey={periodo}
              items={PERIODS.map((p) => ({ key: p.key, label: p.label, href: `/financeiro?tab=caixa&periodo=${p.key}` }))}
            />
            <StatGrid className="grid-cols-2 md:grid-cols-4">
              <Stat
                label="Saldo em caixa"
                value={brl(flow.balance)}
                valueClassName={flow.balance >= 0 ? undefined : "text-red-600"}
                sub="Todo o histórico"
              />
              <Stat label="Entradas" value={brl(flow.inflow)} valueClassName="text-emerald-600" sub="No período" />
              <Stat label="Saídas" value={brl(flow.outflow)} valueClassName="text-red-600" sub="No período" />
              <Stat
                label="Resultado"
                value={brl(flow.inflow - flow.outflow)}
                valueClassName={flow.inflow - flow.outflow >= 0 ? "text-emerald-600" : "text-red-600"}
                sub="Entradas − saídas"
              />
            </StatGrid>

            {flow.entries.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-6 py-10 text-center text-[13px] text-zinc-400">
                Nenhuma movimentação no período.
              </p>
            ) : (
              <Table>
                <THead>
                  <Th>Data</Th>
                  <Th>Descrição</Th>
                  <Th>Tipo</Th>
                  <Th right>Entrada</Th>
                  <Th right>Saída</Th>
                </THead>
                <TBody>
                  {flow.entries.map((e, i) => {
                    const kind = KIND_LABEL[e.kind] ?? KIND_LABEL.conta;
                    return (
                      <Tr key={`${e.kind}-${i}`}>
                        <Td className="text-zinc-500">{fmtDate(e.date)}</Td>
                        <Td className="max-w-[380px]">
                          {e.href ? (
                            <Link href={e.href} className="block truncate font-medium text-zinc-800 underline-offset-2 hover:underline">
                              {e.description}
                            </Link>
                          ) : (
                            <span className="block truncate text-zinc-800">{e.description}</span>
                          )}
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
                      </Tr>
                    );
                  })}
                </TBody>
              </Table>
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
