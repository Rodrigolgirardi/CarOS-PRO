import { brl } from "@/lib/format";
import type { MonthlyPoint } from "@/lib/queries/dashboard";

/**
 * Vendas mês a mês: faturamento (azul), gastos (vermelho) e geração de caixa
 * (verde) dos últimos 12 meses, na mesma escala. Caixa negativo desce abaixo
 * da linha zero. Trio azul/vermelho/verde validado para daltonismo.
 */
export function MonthlySalesChart({ months }: { months: MonthlyPoint[] }) {
  const net = (m: MonthlyPoint) => m.revenue - m.spend;

  // escala única acima e abaixo da linha zero (mesmo R$ por pixel)
  const maxPos = Math.max(
    ...months.map((m) => m.revenue),
    ...months.map((m) => m.spend),
    ...months.map((m) => Math.max(net(m), 0)),
    1
  );
  const maxNeg = Math.max(...months.map((m) => Math.max(-net(m), 0)), 0);
  const abovePct = maxNeg > 0 ? (maxPos / (maxPos + maxNeg)) * 100 : 100;
  const belowPct = 100 - abovePct;

  const sold = months.filter((m) => m.sales > 0);
  const best = sold.length > 0 ? sold.reduce((a, b) => (b.revenue > a.revenue ? b : a)) : null;
  const worst = sold.length > 1 ? sold.reduce((a, b) => (b.revenue < a.revenue ? b : a)) : null;

  const Slot = ({ up, down, cls, downCls }: { up: number; down: number; cls: string; downCls?: string }) => (
    <div className="flex w-full max-w-3.5 flex-col">
      <div className="flex items-end justify-center" style={{ height: `${abovePct}%` }}>
        {up > 0 && (
          <div className={`w-full rounded-t-[3px] ${cls}`} style={{ height: `${Math.max((up / maxPos) * 100, 2)}%` }} />
        )}
      </div>
      {belowPct > 0 && (
        <div className="flex items-start justify-center" style={{ height: `${belowPct}%` }}>
          {down > 0 && (
            <div
              className={`w-full rounded-b-[3px] ${downCls ?? cls}`}
              style={{ height: `${Math.max((down / maxNeg) * 100, 4)}%` }}
            />
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-zinc-900">Vendas mês a mês</h3>
        <div className="flex items-center gap-4 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-600" />
            Faturamento
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-red-500" />
            Gastos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-600" />
            Geração de caixa
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-stretch gap-1.5 sm:gap-2">
        {months.map((m) => {
          const lucro = net(m);
          const empty = m.revenue === 0 && m.spend === 0;
          const hint = empty
            ? `${m.label} — sem movimentação`
            : `${m.label} — Faturamento ${brl(m.revenue)} (${m.sales} venda(s)) · Gastos ${brl(m.spend)} · Geração de caixa ${brl(lucro)}`;
          return (
            <div key={m.key} className="flex min-w-0 flex-1 flex-col items-stretch" title={hint}>
              <div className="relative h-36">
                {/* linha zero */}
                <div className="absolute inset-x-0 border-t border-zinc-200" style={{ top: `${abovePct}%` }} />
                <div className="relative flex h-full justify-center gap-[2px]">
                  {!empty && (
                    <>
                      <Slot up={m.revenue} down={0} cls="bg-blue-600" />
                      <Slot up={m.spend} down={0} cls="bg-red-500" />
                      <Slot
                        up={Math.max(lucro, 0)}
                        down={Math.max(-lucro, 0)}
                        cls="bg-emerald-600"
                        downCls="bg-red-700"
                      />
                    </>
                  )}
                </div>
              </div>
              <span className="mt-1.5 truncate text-center text-[10px] text-zinc-400">{m.label}</span>
              <span
                className={`truncate text-center text-[10px] font-medium tabular-nums ${
                  empty ? "text-zinc-200" : lucro >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {empty ? "·" : lucro >= 0 ? "+" : "−"}
              </span>
            </div>
          );
        })}
      </div>

      {best && (
        <p className="mt-3 border-t border-zinc-100 pt-2.5 text-[11px] text-zinc-500">
          Mês mais forte: <strong className="font-semibold text-zinc-800">{best.label}</strong> ({brl(best.revenue)})
          {worst && worst.key !== best.key && (
            <>
              {" "}
              · mais fraco: <strong className="font-semibold text-zinc-800">{worst.label}</strong> ({brl(worst.revenue)})
            </>
          )}
        </p>
      )}
    </div>
  );
}
