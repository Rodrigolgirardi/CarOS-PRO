import { brl } from "@/lib/format";
import type { MonthlyPoint } from "@/lib/queries/dashboard";

/**
 * Vendas mês a mês: faturamento (azul), gastos (vermelho) e geração de caixa
 * (verde = faturamento − gastos) dos últimos 12 meses, na mesma escala.
 * Trio azul/vermelho/verde validado para daltonismo sobre fundo claro.
 */
export function MonthlySalesChart({ months }: { months: MonthlyPoint[] }) {
  const net = (m: MonthlyPoint) => m.revenue - m.spend;
  const max = Math.max(
    ...months.map((m) => m.revenue),
    ...months.map((m) => m.spend),
    ...months.map((m) => Math.abs(net(m))),
    1
  );
  const h = (n: number) => `${Math.max((Math.abs(n) / max) * 100, n !== 0 ? 2 : 0)}%`;

  const active = months.filter((m) => m.revenue > 0 || m.spend > 0);
  const sold = months.filter((m) => m.sales > 0);
  const best = sold.length > 0 ? sold.reduce((a, b) => (b.revenue > a.revenue ? b : a)) : null;
  const worst = sold.length > 1 ? sold.reduce((a, b) => (b.revenue < a.revenue ? b : a)) : null;

  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5">
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

      <div className="mt-4 flex flex-1 gap-1.5 sm:gap-2">
        {months.map((m) => {
          const lucro = net(m);
          const empty = m.revenue === 0 && m.spend === 0;
          const hint = empty
            ? `${m.label} — sem movimentação`
            : `${m.label} — Faturamento ${brl(m.revenue)} (${m.sales} venda(s)) · Gastos ${brl(m.spend)} · Geração de caixa ${brl(lucro)}`;
          return (
            <div key={m.key} className="flex min-w-0 flex-1 flex-col items-stretch" title={hint}>
              <div className="flex min-h-32 flex-1 items-end justify-center gap-[2px]">
                {empty ? (
                  <div className="h-[2px] w-full rounded-full bg-zinc-100" />
                ) : (
                  <>
                    <div className="w-full max-w-3.5 rounded-t-[3px] bg-blue-600" style={{ height: h(m.revenue) }} />
                    <div className="w-full max-w-3.5 rounded-t-[3px] bg-red-500" style={{ height: h(m.spend) }} />
                    <div
                      className={`w-full max-w-3.5 rounded-t-[3px] ${lucro >= 0 ? "bg-emerald-600" : "bg-red-700"}`}
                      style={{ height: h(lucro) }}
                    />
                  </>
                )}
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

      {(best || active.length > 0) && (
        <p className="mt-3 border-t border-zinc-100 pt-2.5 text-[11px] text-zinc-500">
          {best && (
            <>
              Mês mais forte: <strong className="font-semibold text-zinc-800">{best.label}</strong> ({brl(best.revenue)})
              {worst && worst.key !== best.key && (
                <>
                  {" "}
                  · mais fraco: <strong className="font-semibold text-zinc-800">{worst.label}</strong> (
                  {brl(worst.revenue)})
                </>
              )}
            </>
          )}
        </p>
      )}
    </div>
  );
}
