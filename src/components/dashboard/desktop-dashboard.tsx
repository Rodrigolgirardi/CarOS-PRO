import Link from "next/link";
import { AttentionActivity, buildAttentionItems } from "@/components/dashboard/attention-activity";
import { MonthlySalesChart } from "@/components/dashboard/monthly-chart";
import { MonthlyTable } from "@/components/dashboard/monthly-table";
import { BrandLogo } from "@/components/vehicles/brand-logo";
import { brl, pct } from "@/lib/format";
import type { DashboardData } from "@/lib/queries/dashboard";

// Rampa azul tom sobre tom para o gráfico de estoque: os carros já vêm
// ordenados por valor (desc), então o maior fica com o tom mais escuro.
const STOCK_SHADES = ["bg-blue-900", "bg-blue-800", "bg-blue-700", "bg-blue-600", "bg-blue-500", "bg-blue-400", "bg-blue-300"];
const stockShade = (i: number) => STOCK_SHADES[Math.min(i, STOCK_SHADES.length - 1)];

/** Layout clássico do dashboard — usado apenas no desktop (lg+). */
export function DesktopDashboard({ data }: { data: DashboardData }) {
  const { stock, attention, recent } = data;

  const items = buildAttentionItems(attention);

  return (
    <>
      <section>
        <h2 className="mb-2.5 text-[13px] font-semibold text-zinc-900">Vendas</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_270px]">
          <MonthlySalesChart months={data.monthly} netLabel="Caixa" />
          <MonthlyTable months={data.monthly} />
        </div>
      </section>

      <section className="mt-7">
        <h2 className="mb-2.5 text-[13px] font-semibold text-zinc-900">Estoque</h2>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
            <p className="text-[13px] font-semibold text-zinc-900">
              {stock.count} {stock.count === 1 ? "veículo" : "veículos"} em estoque ·{" "}
              <span className="tabular-nums">{brl(stock.invested)}</span>
            </p>
            <p className="text-xs text-zinc-500">
              {stock.preparing > 0 ? `${stock.preparing} para arrumar` : ""}
            </p>
          </div>
          {stock.vehicles.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-zinc-500">Nenhum veículo em estoque.</p>
          ) : (
            <>
              {/* 2 carros por linha */}
              <div className="grid grid-cols-2">
                {stock.vehicles.map((v, i) => {
                  const share = stock.invested > 0 ? v.invested / stock.invested : 0;
                  const lastRow = i >= Math.ceil(stock.vehicles.length / 2) * 2 - 2;
                  return (
                    <Link
                      key={v.id}
                      href={`/veiculos/${v.id}`}
                      className={`flex min-w-0 items-center justify-between gap-3 border-zinc-100 px-4 py-2.5 transition-colors hover:bg-zinc-50 ${
                        i % 2 === 0 ? "border-r" : ""
                      } ${lastRow ? "" : "border-b"}`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <BrandLogo brand={v.label} size={18} />
                        <span className="truncate text-[13px] font-medium text-zinc-800">{v.label}</span>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                            v.consigned ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {v.consigned ? "Consignado" : "Próprio"}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2.5">
                        <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100 sm:block">
                          <span
                            className={`block h-full rounded-full ${stockShade(i)}`}
                            style={{ width: `${share * 100}%` }}
                          />
                        </span>
                        <span className="w-10 text-right text-xs tabular-nums text-zinc-500">{pct(share, 0)}</span>
                        <span className="w-24 text-right text-[13px] tabular-nums text-zinc-600">{brl(v.invested)}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50/60 px-4 py-2.5">
                <span className="text-[13px] font-semibold text-zinc-900">Custo total (compra + custos)</span>
                <span className="text-[13px] font-semibold tabular-nums text-zinc-900">{brl(stock.invested)}</span>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AttentionActivity items={items} recent={recent} />
      </div>
    </>
  );
}
