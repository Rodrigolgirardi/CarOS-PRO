import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, FileText, History, Pencil, Trash2, User } from "lucide-react";
import { AddCostButton, CostRowActions } from "@/components/vehicles/cost-dialogs";
import { BrandLogo } from "@/components/vehicles/brand-logo";
import { SalePriceButton } from "@/components/vehicles/sale-price-button";
import { StatusSelect } from "@/components/vehicles/status-select";
import { VehiclePhoto } from "@/components/vehicles/vehicle-photo";
import { NewDealButton } from "@/components/deals/new-deal-button";
import { QuickSaleButton } from "@/components/vehicles/quick-sale-button";
import { UploadDocButton } from "@/components/documents/upload-doc-button";
import { TaskCheck } from "@/components/tasks/task-check";
import { TaskCreateButton, TaskEditButton } from "@/components/tasks/task-dialogs";
import { Badge, DealStageBadge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm";
import { Stat, StatGrid } from "@/components/ui/stat";
import { LinkTabs } from "@/components/ui/tabs";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { deleteDocument } from "@/lib/actions/documents";
import { brl, daysUntil, fmtBytes, fmtDate, fmtKm, pct } from "@/lib/format";
import {
  COST_CATEGORY,
  DEFAULT_CHECKLIST,
  DOC_TYPE,
  DOT_CLASS,
  EVENT_META,
  TASK_TYPE,
  VEHICLE_LAUDO,
  VEHICLE_LEILAO,
  VEHICLE_STATUS,
} from "@/lib/labels";
import { vehicleLabel, vehicleMetrics } from "@/lib/metrics";
import { commissionRule } from "@/lib/queries/commissions";
import { customerOptions } from "@/lib/queries/customers";
import { sellerOptions } from "@/lib/queries/sellers";
import { dealsForVehicle } from "@/lib/queries/deals";
import { docsForVehicle } from "@/lib/queries/documents";
import { eventsForVehicle } from "@/lib/queries/events";
import { tasksForVehicle } from "@/lib/queries/tasks";
import { getVehicle, vehicleCosts, vehicleOptions, vehiclePlatforms } from "@/lib/queries/vehicles";
import { PlatformsChecklist } from "@/components/vehicles/platforms-checklist";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await getVehicle(Number(id));
  return { title: v ? vehicleLabel(v) : "Veículo" };
}

function InfoCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3">
        <h3 className="text-[13px] font-semibold text-zinc-900">{title}</h3>
        {action}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

/** Célula compacta (rótulo em cima, valor embaixo) para grades de até 3 por linha. */
function Cell({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-0.5 break-words text-[13px] font-medium text-zinc-900">{value ?? "—"}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <dt className="shrink-0 text-[13px] text-zinc-500">{label}</dt>
      <dd className="text-right text-[13px] font-medium text-zinc-900 tabular-nums">{value ?? "—"}</dd>
    </div>
  );
}

const TABS = ["resumo", "plataformas", "custos", "operacoes", "documentos", "historico"] as const;
type Tab = (typeof TABS)[number];

export default async function VehiclePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id: idParam } = await params;
  const { tab: tabParam } = await searchParams;
  const id = Number(idParam);
  const vehicle = await getVehicle(id);
  if (!vehicle) notFound();

  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "resumo";
  const m = vehicleMetrics(vehicle);
  const label = vehicleLabel(vehicle);
  const sold = vehicle.status === "vendido";

  const costs = await vehicleCosts(id);
  const tasks = await tasksForVehicle(id);
  const docs = await docsForVehicle(id);
  const events = await eventsForVehicle(id);
  const deals = await dealsForVehicle(id);
  const customers = await customerOptions();
  const vehicles = await vehicleOptions();

  const pendingTasks = tasks.filter((t) => t.status === "pendente").length;
  const soldDeal = deals.find((d) => d.stage === "vendido" || d.stage === "entregue");
  const platforms = await vehiclePlatforms(id);

  const sortedTasks = [...tasks].sort((a, b) => {
    const ia = DEFAULT_CHECKLIST.indexOf(a.type);
    const ib = DEFAULT_CHECKLIST.indexOf(b.type);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.id - b.id;
  });

  return (
    <>
      {/* ------------------------------------------------ cabeçalho */}
      <div className="mb-6">
        <Link
          href="/veiculos"
          className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700"
        >
          ← Veículos
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <VehiclePhoto photo={vehicle.photo} brand={vehicle.brand} size="xl" alt={label} />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-zinc-900">
                {vehicle.brand} {vehicle.model}
                {vehicle.version && <span className="font-normal text-zinc-500"> {vehicle.version}</span>}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-zinc-500">
                {vehicle.year_fab && (
                  <span>
                    {String(vehicle.year_fab).slice(-2)}/{String(vehicle.year_model ?? vehicle.year_fab).slice(-2)}
                  </span>
                )}
                {vehicle.km != null && <span>{fmtKm(vehicle.km)}</span>}
                {vehicle.color && <span>{vehicle.color}</span>}
                {vehicle.transmission && <span>{vehicle.transmission}</span>}
                {vehicle.plate && (
                  <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[11px] text-zinc-600">
                    {vehicle.plate}
                  </span>
                )}
              </p>
              {/* status + ações, coladas na foto; Lead e Venda sempre lado a lado */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span
                  title={VEHICLE_STATUS[vehicle.status].label}
                  className={`size-2.5 shrink-0 rounded-full ${DOT_CLASS[VEHICLE_STATUS[vehicle.status].tone]}`}
                />
                {!sold && <StatusSelect id={id} status={vehicle.status} />}
                {!sold && (
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <NewDealButton vehicles={vehicles} customers={customers} vehicleId={id} label="Lead" />
                    <QuickSaleButton
                      vehicles={vehicles}
                      sellers={await sellerOptions()}
                      customers={customers}
                      defaultCommission={await commissionRule("venda_carro")}
                      fixedVehicleId={id}
                    />
                  </span>
                )}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 empty:mt-0">
                {sold && soldDeal && (
                  <span className="text-[13px] text-zinc-500">
                    para{" "}
                    <Link
                      href={`/clientes/${soldDeal.customer_id}`}
                      className="font-medium text-zinc-900 underline-offset-2 hover:underline"
                    >
                      {soldDeal.customer_name}
                    </Link>{" "}
                    em {fmtDate(soldDeal.sold_date)}
                  </span>
                )}
                {!sold && (m.days ?? 0) > 60 && (
                  <Badge tone="amber" dot>
                    {m.days} dias em estoque
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ números grandes */}
      <StatGrid className="grid-cols-2 md:grid-cols-4">
        <Stat
          label="Custo total"
          value={brl(m.totalCost)}
          sub={
            vehicle.consignado === 1 && !sold
              ? `Repasse ${brl(vehicle.consignor_value ?? 0)} + ${costs.length} custo(s)`
              : `Compra ${brl(vehicle.purchase_price)} + ${costs.length} custo(s)`
          }
        />
        <Stat
          label={sold ? "Vendido por" : "Preço de venda"}
          value={
            <span className="inline-flex items-center gap-1.5">
              {brl(m.priceRef)}
              {!sold && <SalePriceButton vehicleId={id} current={vehicle.sale_price} />}
            </span>
          }
          sub={sold ? fmtDate(vehicle.sold_date) : vehicle.sale_price == null ? "Ainda não definido" : "Preço anunciado"}
        />
        <Stat
          label={sold ? "Lucro" : "Lucro potencial"}
          value={m.profit == null ? "—" : brl(m.profit)}
          valueClassName={m.profit == null ? "text-zinc-400" : m.profit >= 0 ? "text-emerald-600" : "text-red-600"}
          sub={sold ? "Venda − custo total" : "Se vender pelo preço anunciado"}
        />
        <Stat label="Margem" value={pct(m.margin)} sub={m.days != null ? `${m.days} dias em estoque` : undefined} />
      </StatGrid>

      {/* ------------------------------------------------ abas */}
      <LinkTabs
        className="mt-6 mb-5"
        activeKey={tab}
        tabs={[
          { key: "resumo", label: "Resumo", href: `/veiculos/${id}` },
          { key: "plataformas", label: "Plataformas", count: platforms.length, href: `/veiculos/${id}?tab=plataformas` },
          { key: "custos", label: "Custos", count: costs.length, href: `/veiculos/${id}?tab=custos` },
          { key: "documentos", label: "Documentos", count: docs.length, href: `/veiculos/${id}?tab=documentos` },
          { key: "historico", label: "Histórico", href: `/veiculos/${id}?tab=historico` },
        ]}
      />

      {tab === "resumo" && (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          <InfoCard
            title="Informações do veículo"
            action={
              <Link
                href={`/veiculos/${id}/editar`}
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
              >
                <Pencil size={12} />
                Editar
              </Link>
            }
          >
            <dl className="grid grid-cols-3 gap-x-4 gap-y-3.5">
              <Cell
                label="Marca"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <BrandLogo brand={vehicle.brand} size={14} />
                    {vehicle.brand}
                  </span>
                }
              />
              <Cell label="Modelo" value={vehicle.model} />
              <Cell label="Versão" value={vehicle.version} />
              <Cell label="Ano" value={vehicle.year_fab ? `${vehicle.year_fab}/${vehicle.year_model ?? vehicle.year_fab}` : null} />
              <Cell label="Placa" value={vehicle.plate} />
              <Cell label="KM" value={vehicle.km != null ? fmtKm(vehicle.km) : null} />
              <Cell label="Cor" value={vehicle.color} />
              <Cell label="Câmbio" value={vehicle.transmission} />
              <Cell label="Combustível" value={vehicle.fuel} />
              <Cell label="Renavam" value={vehicle.renavam} />
              <Cell label="Blindado" value={vehicle.blindado == null ? null : vehicle.blindado ? "Sim" : "Não"} />
              <Cell label="Leilão" value={vehicle.leilao ? VEHICLE_LEILAO[vehicle.leilao] : null} />
              <Cell label="Chassi" value={vehicle.chassis} className="col-span-3" />
              <Cell
                label="Laudo cautelar"
                value={vehicle.laudo ? VEHICLE_LAUDO[vehicle.laudo] : null}
                className="col-span-3"
              />
              {vehicle.consignado === 1 && (
                <>
                  <Cell label="Consignação — dono" value={vehicle.consignor} className="col-span-2" />
                  <Cell
                    label="Repasse"
                    value={vehicle.consignor_value != null ? brl(vehicle.consignor_value) : null}
                  />
                </>
              )}
            </dl>
            {vehicle.notes && (
              <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-[13px] leading-relaxed text-zinc-600">
                {vehicle.notes}
              </p>
            )}
          </InfoCard>

          <div className="space-y-5">
            <InfoCard
              title={vehicle.consignado === 1 ? "Consignação" : "Compra"}
              action={
                <Link
                  href={`/veiculos/${id}/editar`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
                >
                  <Pencil size={12} />
                  Editar
                </Link>
              }
            >
              <dl className="grid grid-cols-3 gap-x-4 gap-y-3.5">
                <Cell
                  label={vehicle.consignado === 1 ? "Dono (consignante)" : "Comprado de"}
                  value={vehicle.consignado === 1 ? vehicle.consignor : vehicle.purchase_seller}
                  className="col-span-2"
                />
                <Cell
                  label={vehicle.consignado === 1 ? "Data da consignação" : "Data da compra"}
                  value={vehicle.purchase_date ? fmtDate(vehicle.purchase_date) : null}
                />
                <Cell label="CPF" value={vehicle.origin_cpf} />
                <Cell
                  label="WhatsApp"
                  value={
                    vehicle.origin_whatsapp ? (
                      <a
                        href={`https://wa.me/55${vehicle.origin_whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 underline-offset-2 hover:underline"
                      >
                        {vehicle.origin_whatsapp}
                      </a>
                    ) : null
                  }
                />
                <Cell
                  label="E-mail"
                  value={
                    vehicle.origin_email ? (
                      <a
                        href={`mailto:${vehicle.origin_email}`}
                        className="text-zinc-900 underline-offset-2 hover:underline"
                      >
                        {vehicle.origin_email}
                      </a>
                    ) : null
                  }
                />
                <Cell label="Pagamento" value={vehicle.purchase_payment} />
                <Cell label="Preço de compra" value={brl(vehicle.purchase_price)} className="col-span-2" />
              </dl>
              {vehicle.purchase_notes && (
                <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-[13px] leading-relaxed text-zinc-600">
                  {vehicle.purchase_notes}
                </p>
              )}
            </InfoCard>

            {soldDeal && (
              <InfoCard title="Venda">
                <dl>
                  <Row
                    label="Cliente"
                    value={
                      <Link href={`/clientes/${soldDeal.customer_id}`} className="underline-offset-2 hover:underline">
                        {soldDeal.customer_name}
                      </Link>
                    }
                  />
                  <Row label="Data" value={fmtDate(soldDeal.sold_date)} />
                  <Row label="Valor da venda" value={brl(soldDeal.sale_price)} />
                  {soldDeal.down_payment != null && <Row label="Entrada" value={brl(soldDeal.down_payment)} />}
                  {soldDeal.financed_amount != null && <Row label="Financiado" value={brl(soldDeal.financed_amount)} />}
                  {soldDeal.trade_in_value != null && (
                    <Row label={`Troca${soldDeal.trade_in_desc ? ` (${soldDeal.trade_in_desc})` : ""}`} value={brl(soldDeal.trade_in_value)} />
                  )}
                  {soldDeal.commission != null && <Row label="Comissão" value={brl(soldDeal.commission)} />}
                  <Row label="Recebido" value={<span className="text-emerald-600">{brl(soldDeal.received)}</span>} />
                  {soldDeal.pending > 0 && (
                    <Row
                      label="Pendente"
                      value={
                        <Link href="/financeiro?tab=receber" className="text-amber-600 underline-offset-2 hover:underline">
                          {brl(soldDeal.pending)}
                        </Link>
                      }
                    />
                  )}
                  {soldDeal.delivered_date && <Row label="Entregue em" value={fmtDate(soldDeal.delivered_date)} />}
                </dl>
              </InfoCard>
            )}

          </div>
        </div>
      )}

      {tab === "plataformas" && <PlatformsChecklist vehicleId={id} marked={platforms} />}

      {tab === "custos" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <AddCostButton vehicleId={id} />
          </div>
          <Table>
            <THead>
              <Th>Data</Th>
              <Th>Categoria</Th>
              <Th>Descrição</Th>
              <Th right>Valor</Th>
              <Th />
            </THead>
            <TBody>
              {costs.length === 0 && (
                <Tr>
                  <Td className="py-6 text-center text-zinc-500" colSpan={5}>
                    Nenhum custo lançado ainda.
                  </Td>
                </Tr>
              )}
              {costs.map((c) => (
                <Tr key={c.id}>
                  <Td className="text-zinc-500">{fmtDate(c.date)}</Td>
                  <Td>
                    <Badge>{COST_CATEGORY[c.category]}</Badge>
                  </Td>
                  <Td className="max-w-[360px] truncate text-zinc-600">{c.description ?? "—"}</Td>
                  <Td right className="font-medium">
                    {brl(c.amount)}
                  </Td>
                  <Td className="w-20">
                    <CostRowActions cost={c} />
                  </Td>
                </Tr>
              ))}
            </TBody>
            <tfoot className="border-t border-zinc-200 text-[13px]">
              <tr>
                <td colSpan={3} className="px-3 py-2 text-zinc-500">
                  Preço de compra
                </td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">{brl(vehicle.purchase_price)}</td>
                <td />
              </tr>
              <tr>
                <td colSpan={3} className="px-3 py-2 text-zinc-500">
                  Custos ({costs.length})
                </td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">{brl(vehicle.costs_total)}</td>
                <td />
              </tr>
              <tr className="border-t border-zinc-200 bg-zinc-50/60">
                <td colSpan={3} className="px-3 py-2.5 font-semibold text-zinc-900">
                  Custo total
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-zinc-900">
                  {brl(vehicle.total_cost)}
                </td>
                <td />
              </tr>
            </tfoot>
          </Table>
        </div>
      )}

      {tab === "operacoes" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs text-zinc-500">
                {tasks.length - pendingTasks} de {tasks.length} tarefas concluídas
              </p>
              <div className="mt-1.5 h-1 w-full max-w-[240px] overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-zinc-900 transition-all"
                  style={{ width: `${tasks.length ? ((tasks.length - pendingTasks) / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <TaskCreateButton vehicleId={id} />
          </div>
          <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white shadow-card">
            {sortedTasks.map((t: Task) => {
              const done = t.status === "concluida";
              const overdue = !done && t.due_date != null && daysUntil(t.due_date) < 0;
              return (
                <div key={t.id} className="group flex items-center gap-3 px-4 py-2.5">
                  <TaskCheck id={t.id} done={done} label={TASK_TYPE[t.type].label} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] font-medium ${done ? "text-zinc-500 line-through" : "text-zinc-800"}`}>
                      {TASK_TYPE[t.type].label}
                      {t.description && (
                        <span className={`font-normal ${done ? "text-zinc-400" : "text-zinc-500"}`}> — {t.description}</span>
                      )}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-xs text-zinc-500">
                      {t.assignee && <span>{t.assignee}</span>}
                      {t.due_date && !done && (
                        <span className={`inline-flex items-center gap-1 ${overdue ? "font-medium text-red-500" : ""}`}>
                          <CalendarClock size={11} />
                          {fmtDate(t.due_date)}
                          {overdue && " · atrasada"}
                        </span>
                      )}
                      {done && t.done_date && <span>concluída em {fmtDate(t.done_date)}</span>}
                      {t.cost != null && <span className="tabular-nums">{brl(t.cost)}</span>}
                    </p>
                  </div>
                  <TaskEditButton task={t} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "documentos" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <UploadDocButton vehicleId={id} customers={customers} />
          </div>
          {docs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/30 px-6 py-10 text-center text-[13px] text-zinc-500 shadow-card">
              Nenhum documento anexado — CRLV, ATPV-e, contrato, laudo…
            </div>
          ) : (
            <Table>
              <THead>
                <Th>Documento</Th>
                <Th>Tipo</Th>
                <Th right>Tamanho</Th>
                <Th>Data</Th>
                <Th />
              </THead>
              <TBody>
                {docs.map((d) => (
                  <Tr key={d.id}>
                    <Td>
                      <a
                        href={`/api/uploads/${encodeURIComponent(d.file_name)}`}
                        target="_blank"
                        className="flex items-center gap-2 font-medium text-zinc-800 underline-offset-2 hover:underline"
                      >
                        <FileText size={14} className="shrink-0 text-zinc-300" />
                        {d.name}
                      </a>
                    </Td>
                    <Td>
                      <Badge>{DOC_TYPE[d.type]}</Badge>
                    </Td>
                    <Td right className="text-zinc-500">
                      {fmtBytes(d.size)}
                    </Td>
                    <Td className="text-zinc-500">{fmtDate(d.created_at.slice(0, 10))}</Td>
                    <Td className="w-10">
                      <ConfirmButton
                        action={deleteDocument.bind(null, d.id)}
                        title={`Excluir ${d.name}?`}
                        description="O arquivo será apagado do disco."
                        variant="danger-ghost"
                        className="size-8 p-0"
                      >
                        <Trash2 size={16} />
                      </ConfirmButton>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </div>
      )}

      {tab === "historico" && (
        <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-card">
          {events.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-zinc-500">Nada registrado ainda.</p>
          ) : (
            <ol>
              {events.map((e, i) => {
                const meta = EVENT_META[e.type] ?? EVENT_META.outro;
                return (
                  <li key={e.id} className="relative flex gap-3.5 pb-5 last:pb-0">
                    {i < events.length - 1 && (
                      <span className="absolute left-[5px] top-4 h-full w-px bg-zinc-100" aria-hidden />
                    )}
                    <span className={`relative mt-[5px] size-[11px] shrink-0 rounded-full border-2 border-white ring-1 ring-zinc-200 ${DOT_CLASS[meta.tone]}`} />
                    <div className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[13px] text-zinc-800">{e.description}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                          <Badge tone={meta.tone} className="px-1.5 py-0 text-[11px]">
                            {meta.label}
                          </Badge>
                          {fmtDate(e.date)}
                        </p>
                      </div>
                      {e.amount != null && (
                        <span className="shrink-0 text-[13px] font-medium tabular-nums text-zinc-600">
                          {brl(e.amount)}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {events.length > 0 && (
            <p className="mt-2 flex items-center gap-1.5 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
              <History size={12} />
              Tudo que acontece com o veículo é registrado automaticamente.
            </p>
          )}
        </div>
      )}
    </>
  );
}
