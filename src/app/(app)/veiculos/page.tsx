import Link from "next/link";
import { Car, Clock, Megaphone, Plus, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ChipInner, chipCls } from "@/components/ui/action-chip";
import { VehicleStatusBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkTabs } from "@/components/ui/tabs";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { AddExpenseButton } from "@/components/vehicles/add-expense-button";
import { AddIncomeButton } from "@/components/finance/add-income-button";
import { PlateLookupButton } from "@/components/plate-cache/plate-lookup-button";
import { QuickSaleButton } from "@/components/vehicles/quick-sale-button";
import { customerOptions } from "@/lib/queries/customers";
import { sellerOptions } from "@/lib/queries/sellers";
import { VehiclePhoto } from "@/components/vehicles/vehicle-photo";
import { PlatformsHover } from "@/components/vehicles/platforms-hover";
import { VehicleRowActions } from "@/components/vehicles/vehicle-row-actions";
import { VehicleSearch } from "@/components/vehicles/vehicle-search";
import { brl, pct } from "@/lib/format";
import { vehicleMetrics, vehicleLabel } from "@/lib/metrics";
import { commissionRule, listCommissionRules } from "@/lib/queries/commissions";
import { listVehicles, vehicleCounts, vehicleOptions, type VehicleFilter } from "@/lib/queries/vehicles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Veículos" };

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const TABS: { key: VehicleFilter; label: string }[] = [
  { key: "cadastrado", label: "Cadastrados" },
  { key: "para_cadastrar", label: "Cadastrar" },
  { key: "vendido", label: "Vendidos" },
];

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; busca?: string }>;
}) {
  const { filtro, busca } = await searchParams;
  // filtros sem aba, mas acessíveis por link (ex.: dashboard)
  const LINK_ONLY = ["parados", "todos", "estoque", "para_arrumar"];
  const valid = TABS.some((t) => t.key === filtro) || LINK_ONLY.includes(filtro ?? "");
  const filter = (valid ? filtro : "cadastrado") as VehicleFilter;
  // tudo em paralelo e uma vez só (os modais de venda/saída/entrada reusam as mesmas listas)
  const [allRows, counts, vehOptions, sellers, customers, rules, saleCommission] = await Promise.all([
    listVehicles(filter),
    vehicleCounts(),
    vehicleOptions(),
    sellerOptions(),
    customerOptions(),
    listCommissionRules(),
    commissionRule("venda_carro"),
  ]);
  // busca por marca/modelo/versão e placa (com e sem caracteres especiais)
  const q = busca?.trim() ? norm(busca.trim()) : null;
  const qAlnum = q ? q.replace(/[^a-z0-9]/g, "") : "";
  const rows = q
    ? allRows.filter((v) => {
        if (norm(`${v.brand} ${v.model} ${v.version ?? ""}`).includes(q)) return true;
        if (!v.plate) return false;
        const plate = v.plate.toLowerCase();
        return plate.includes(q) || (qAlnum !== "" && plate.replace(/[^a-z0-9]/g, "").includes(qAlnum));
      })
    : allRows;
  const tabCount: Record<string, number> = {
    estoque: counts.todos - (counts.vendido ?? 0),
    para_cadastrar: counts.para_cadastrar ?? 0,
    // Cadastrados engloba também os "para arrumar"
    cadastrado: (counts.cadastrado ?? 0) + (counts.para_arrumar ?? 0),
    vendido: counts.vendido ?? 0,
  };

  return (
    <>
      <PageHeader title="Veículos" description="Seu estoque, do jeito que ele está agora." />

      {/* celular: chips (visual das Ações rápidas) · desktop: botões clássicos */}
      <div className="mb-5 grid grid-cols-4 gap-2 lg:hidden">
        <Link href="/compras/nova" className={chipCls("violet", "justify-center! px-2")}>
          <ChipInner icon={Plus} label="Veículo" color="violet" compact />
        </Link>
        <QuickSaleButton
          vehicles={vehOptions}
          sellers={sellers}
          customers={customers}
          defaultCommission={saleCommission}
          chip
        />
        <AddExpenseButton vehicles={vehOptions} chip />
        <AddIncomeButton customers={customers} sellers={sellers} rules={rules} chip />
        <div className="col-span-4 flex justify-center">
          <PlateLookupButton chip />
        </div>
      </div>
      <div className="mb-5 hidden flex-wrap items-center gap-2 lg:flex">
        <LinkButton href="/compras/nova" variant="primary">
          <Plus size={14} />
          Adicionar veículo
        </LinkButton>
        <AddExpenseButton vehicles={vehOptions} />
        <AddIncomeButton customers={customers} sellers={sellers} rules={rules} />
        <PlateLookupButton />
        <QuickSaleButton
          vehicles={vehOptions}
          sellers={sellers}
          customers={customers}
          defaultCommission={saleCommission}
        />
      </div>

      <LinkTabs
        className="mb-4"
        mobileCounts
        activeKey={filter === "parados" ? "" : filter}
        tabs={TABS.map((t) => ({
          key: t.key,
          label: t.label,
          count: tabCount[t.key] ?? 0,
          href: t.key === "cadastrado" ? "/veiculos" : `/veiculos?filtro=${t.key}`,
        }))}
      />

      <div className="mb-4 lg:max-w-sm">
        <VehicleSearch busca={busca ?? null} />
      </div>

      {filter === "parados" && (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Mostrando veículos parados há mais de 60 dias.
          <Link href="/veiculos" className="underline underline-offset-2 hover:text-amber-900">
            Ver todos
          </Link>
        </p>
      )}

      {q && rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 px-6 py-10 text-center text-[13px] text-zinc-500">
          Nenhum veículo encontrado para essa busca.
        </p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Car}
          title={filter === "cadastrado" || filter === "estoque" ? "Estoque zerado — tudo vendido! 🎉" : "Nenhum veículo neste filtro"}
          description={
            filter === "cadastrado" || filter === "estoque"
              ? "Nenhum carro à venda no momento. Registre a próxima compra para repor o estoque."
              : "Troque o filtro acima para ver outros veículos."
          }
          action={
            filter === "cadastrado" || filter === "estoque" ? (
              <LinkButton href="/compras/nova" variant="primary">
                <Plus size={14} />
                Registrar compra
              </LinkButton>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* celular: lista compacta — foto, nome, placa, consignado/próprio e valor de venda */}
          <div className="space-y-2 lg:hidden">
            {rows.map((v) => {
              const m = vehicleMetrics(v);
              return (
                <Link
                  key={v.id}
                  href={`/veiculos/${v.id}`}
                  className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-card active:bg-zinc-50"
                >
                  <span className="flex items-center gap-3.5">
                    <VehiclePhoto photo={v.photo} brand={v.brand} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-[15px] font-medium text-zinc-900">
                            {v.brand} {v.model}
                          </span>
                          {v.plate && (
                            <span className="shrink-0 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[11px] text-zinc-600">
                              {v.plate}
                            </span>
                          )}
                        </span>
                        <VehicleStatusBadge status={v.status} />
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {v.year_fab && (
                          <span className="text-xs font-medium text-zinc-500">
                            {String(v.year_fab).slice(-2)}/{String(v.year_model ?? v.year_fab).slice(-2)}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                            v.consignado === 1 ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {v.consignado === 1 ? "Consignado" : "Próprio"}
                        </span>
                        <span
                          className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                            v.platforms_count > 0 ? "bg-sky-50 text-sky-700" : "bg-red-50 text-red-600"
                          }`}
                        >
                          {v.platforms_count > 0 ? (
                            <Megaphone size={10} />
                          ) : (
                            <TriangleAlert size={10} className="text-amber-500" />
                          )}
                          {v.platforms_count === 1 ? "1 plataforma" : `${v.platforms_count} plataformas`}
                        </span>
                        {!m.sold && m.days != null && (
                          <span
                            className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                              m.days > 60 ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            <Clock size={10} />
                            {m.days} {m.days === 1 ? "dia" : "dias"}
                          </span>
                        )}
                      </span>
                    </span>
                  </span>
                  <span className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-zinc-100 bg-zinc-100">
                    <span className="block bg-zinc-50/60 px-2.5 py-2">
                      <span className="block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                        {v.consignado === 1 ? "Repasse" : "Compra"}
                      </span>
                      <span className="mt-0.5 block text-[13px] font-medium text-zinc-700">
                        {v.consignado === 1
                          ? v.consignor_value != null
                            ? brl(v.consignor_value)
                            : "—"
                          : brl(v.purchase_price)}
                      </span>
                    </span>
                    <span className="block bg-zinc-50/60 px-2.5 py-2">
                      <span className="block text-[11px] font-medium uppercase tracking-wide text-zinc-500">Venda</span>
                      <span className="mt-0.5 block text-[13px] font-semibold text-zinc-900">{brl(m.priceRef)}</span>
                    </span>
                    <span className="block bg-zinc-50/60 px-2.5 py-2">
                      <span className="block text-[11px] font-medium uppercase tracking-wide text-zinc-500">Margem</span>
                      <span
                        className={`mt-0.5 block text-[13px] font-semibold ${
                          m.profit == null ? "text-zinc-400" : m.profit >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {m.profit == null ? "—" : brl(m.profit)}
                        {m.profit != null && m.margin != null && (
                          <span className="ml-1 text-[11px] font-medium opacity-80">({pct(m.margin)})</span>
                        )}
                      </span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>

          {/* computador: tabela completa */}
          <div className="hidden lg:block">
            <Table>
          <THead>
            <Th>Veículo</Th>
            <Th>Anúncios</Th>
            <Th>Ano</Th>
            <Th>Placa</Th>
            <Th right>KM</Th>
            <Th right>Compra</Th>
            <Th right>FIPE</Th>
            <Th right>Custo total</Th>
            <Th right>Venda</Th>
            <Th right>Lucro</Th>
            <Th right>Margem</Th>
            <Th right>Dias</Th>
            {filter !== "vendido" && <Th>Status</Th>}
            <Th />
          </THead>
          <TBody>
            {rows.map((v) => {
              const m = vehicleMetrics(v);
              const label = vehicleLabel(v);
              return (
                <Tr key={v.id}>
                  <Td className="max-w-[210px]">
                    <Link href={`/veiculos/${v.id}`} className="flex items-center gap-2.5">
                      <VehiclePhoto photo={v.photo} brand={v.brand} size="sm" />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate font-medium text-zinc-900 group-hover:underline group-hover:underline-offset-2">
                            {v.brand} {v.model}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                              v.consignado === 1 ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {v.consignado === 1 ? "Consignado" : "Próprio"}
                          </span>
                        </span>
                        <span className="block truncate text-xs text-zinc-500">{v.version ?? "—"}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td>
                    <PlatformsHover list={v.platforms_list} />
                  </Td>
                  <Td className="text-zinc-500">
                    {v.year_fab
                      ? `${String(v.year_fab).slice(-2)}/${String(v.year_model ?? v.year_fab).slice(-2)}`
                      : "—"}
                  </Td>
                  <Td>
                    {v.plate ? (
                      <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[11px] text-zinc-600">
                        {v.plate}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </Td>
                  <Td right className="text-zinc-500">
                    {v.km != null ? v.km.toLocaleString("pt-BR") : "—"}
                  </Td>
                  <Td right className="text-zinc-500">
                    {brl(v.purchase_price)}
                  </Td>
                  <Td right className="text-zinc-500">
                    {v.fipe_price != null ? brl(v.fipe_price) : <span className="text-zinc-400">—</span>}
                  </Td>
                  <Td right className="font-medium text-zinc-900">
                    {brl(m.totalCost)}
                  </Td>
                  <Td right className="text-zinc-900">
                    {brl(m.priceRef)}
                  </Td>
                  <Td right className={m.profit == null ? "text-zinc-400" : m.profit >= 0 ? "font-medium text-emerald-600" : "font-medium text-red-600"}>
                    {m.profit == null ? "—" : brl(m.profit)}
                  </Td>
                  <Td right className="text-zinc-500">
                    {pct(m.margin)}
                  </Td>
                  <Td right className={!m.sold && (m.days ?? 0) > 60 ? "font-medium text-amber-600" : "text-zinc-500"}>
                    {m.days ?? "—"}
                  </Td>
                  {filter !== "vendido" && (
                    <Td>
                      <VehicleStatusBadge status={v.status} />
                    </Td>
                  )}
                  <Td className="w-10">
                    <VehicleRowActions id={v.id} label={label} />
                  </Td>
                </Tr>
              );
            })}
          </TBody>
            </Table>
          </div>
        </>
      )}
    </>
  );
}
