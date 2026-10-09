import Link from "next/link";
import { brl, pct } from "@/lib/format";
import type { StockVehicleSlice } from "@/lib/queries/dashboard";

/**
 * Gráfico de composição do estoque: capital investido (azul) + lucro potencial
 * (verde) = valor de venda. Prejuízo aparece em vermelho no fim da barra.
 * Par azul/verde validado para daltonismo sobre fundo claro (ΔE deutan 24,9).
 */

function Seg({ className, w, label }: { className: string; w: number; label: string }) {
  if (w <= 0) return null;
  return (
    <div
      className={`${className} h-full min-w-[3px] rounded-[3px]`}
      style={{ width: `${w}%` }}
      title={label}
    />
  );
}

function Bar({ invested, profit, scale, h = "h-3" }: { invested: number; profit: number | null; scale: number; h?: string }) {
  const w = (n: number) => (scale > 0 ? (n / scale) * 100 : 0);
  return (
    <div className={`flex w-full items-stretch gap-[2px] ${h}`}>
      {profit != null && profit < 0 ? (
        <>
          <Seg className="bg-blue-600" w={w(invested + profit)} label={`Valor de venda: ${brl(invested + profit)}`} />
          <Seg className="bg-red-500" w={w(-profit)} label={`Prejuízo potencial: ${brl(profit)}`} />
        </>
      ) : (
        <>
          <Seg className="bg-blue-600" w={w(invested)} label={`Capital investido: ${brl(invested)}`} />
          {profit != null && profit > 0 && (
            <Seg className="bg-emerald-600" w={w(profit)} label={`Lucro potencial: ${brl(profit)}`} />
          )}
        </>
      )}
    </div>
  );
}

function Headline({
  dot,
  label,
  value,
  sub,
  valueClassName,
}: {
  dot?: string;
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        {dot && <span className={`size-2 shrink-0 rounded-full ${dot}`} />}
        {label}
      </p>
      <p className={`mt-1 text-xl font-semibold tracking-tight tabular-nums ${valueClassName ?? "text-zinc-900"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 truncate text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

export function StockChart({ vehicles }: { vehicles: StockVehicleSlice[] }) {
  const priced = vehicles.filter((v) => v.sale != null && v.profit != null);
  const unpriced = vehicles.length - priced.length;

  const investedAll = vehicles.reduce((s, v) => s + v.invested, 0);
  const investedPriced = priced.reduce((s, v) => s + v.invested, 0);
  const purchasePriced = priced.reduce((s, v) => s + v.purchase, 0);
  const saleValue = priced.reduce((s, v) => s + (v.sale ?? 0), 0);
  const profit = priced.reduce((s, v) => s + (v.profit ?? 0), 0);

  const roi = investedPriced > 0 ? profit / investedPriced : null;
  const overPurchase = purchasePriced > 0 ? profit / purchasePriced : null;
  const margin = saleValue > 0 ? profit / saleValue : null;

  // escala única: todas as barras por veículo comparáveis entre si
  const scale = Math.max(...vehicles.map((v) => v.invested + Math.max(v.profit ?? 0, 0)), 1);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Headline dot="bg-blue-600" label="Capital investido" value={brl(investedAll)} sub="Compra + custos" />
        <Headline
          label="Valor de venda"
          value={brl(saleValue)}
          sub={unpriced > 0 ? `${unpriced} sem preço definido` : "Todos com preço"}
        />
        <Headline
          dot={profit < 0 ? "bg-red-500" : "bg-emerald-600"}
          label="Lucro potencial"
          value={brl(profit)}
          valueClassName={profit >= 0 ? "text-emerald-600" : "text-red-600"}
          sub={margin != null ? `Margem ${pct(margin)}` : undefined}
        />
      </div>

      {priced.length > 0 && (
        <div className="mt-4">
          <Bar invested={investedPriced} profit={profit} scale={investedPriced + Math.max(profit, 0)} h="h-3.5" />
          <p className="mt-1.5 text-[11px] text-zinc-500">
            A barra soma o valor de venda dos veículos com preço definido: investido + lucro.
          </p>
        </div>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
        {[
          { label: "ROI s/ investido", value: pct(roi), hint: "Lucro potencial ÷ capital investido (compra + custos)" },
          { label: "% s/ valor de compra", value: pct(overPurchase), hint: "Lucro potencial ÷ preço de compra" },
          { label: "Margem s/ venda", value: pct(margin), hint: "Lucro potencial ÷ valor de venda" },
        ].map((m) => (
          <div key={m.label} className="bg-white px-3 py-2.5" title={m.hint}>
            <dt className="truncate text-[11px] font-medium text-zinc-500">{m.label}</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-900">{m.value}</dd>
          </div>
        ))}
      </dl>

      {vehicles.length > 0 && (
        <div className="mt-5 border-t border-zinc-100 pt-4">
          <div className="flex items-end gap-2 sm:gap-3">
            {vehicles.map((v) => {
              const vRoi = v.profit != null && v.invested > 0 ? v.profit / v.invested : null;
              const total = v.invested + Math.max(v.profit ?? 0, 0);
              const hint =
                v.profit == null
                  ? `${v.label} — investido ${brl(v.invested)}, sem preço de venda definido`
                  : `${v.label} — investido ${brl(v.invested)}, ${v.profit >= 0 ? "lucro" : "prejuízo"} ${brl(v.profit)} (ROI ${pct(vRoi, 0)})`;
              return (
                <Link
                  key={v.id}
                  href={`/veiculos/${v.id}`}
                  title={hint}
                  className="group flex min-w-0 flex-1 flex-col items-stretch"
                >
                  <span
                    className={`mb-1 text-center text-[11px] font-medium tabular-nums ${
                      v.profit == null ? "text-zinc-400" : v.profit >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {v.profit == null ? "—" : pct(vRoi, 0)}
                  </span>
                  <div className="flex h-20 flex-col justify-end">
                    <div
                      className="flex flex-col justify-end gap-[2px]"
                      style={{ height: `${Math.max((total / scale) * 100, 2)}%` }}
                    >
                      {v.profit != null && v.profit < 0 ? (
                        <>
                          <div
                            className="w-full min-h-[3px] rounded-[3px] bg-red-500"
                            style={{ height: `${(-v.profit / total) * 100}%` }}
                          />
                          <div
                            className="w-full min-h-[3px] rounded-[3px] bg-blue-600"
                            style={{ height: `${((v.invested + v.profit) / total) * 100}%` }}
                          />
                        </>
                      ) : (
                        <>
                          {v.profit != null && v.profit > 0 && (
                            <div
                              className="w-full min-h-[3px] rounded-[3px] bg-emerald-600"
                              style={{ height: `${(v.profit / total) * 100}%` }}
                            />
                          )}
                          <div
                            className="w-full min-h-[3px] rounded-[3px] bg-blue-600"
                            style={{ height: `${(v.invested / total) * 100}%` }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <span className="mt-1.5 truncate text-center text-[11px] text-zinc-500 group-hover:text-zinc-900 group-hover:underline group-hover:underline-offset-2">
                    {v.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
