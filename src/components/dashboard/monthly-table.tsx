import { brl } from "@/lib/format";
import type { MonthlyPoint } from "@/lib/queries/dashboard";

/**
 * Faturamento e caixa mês a mês (jan–dez), inclusive meses zerados — ao lado do
 * gráfico. Caixa = faturamento − saídas (compras + custos + contas): fluxo de
 * caixa, não lucratividade.
 */
export function MonthlyTable({ months }: { months: MonthlyPoint[] }) {
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const totalCash = months.reduce((s, m) => s + (m.revenue - m.spend), 0);
  const tone = (v: number) => (v > 0 ? "text-emerald-600" : v < 0 ? "text-red-600" : "text-zinc-400");

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="grid grid-cols-[2.5rem_1fr_1fr] gap-2 border-b border-zinc-200 bg-zinc-50/60 px-3 py-2 text-[11px] font-medium text-zinc-500">
        <span>Mês</span>
        <span className="text-right">Faturamento</span>
        <span className="text-right">Caixa</span>
      </div>
      <div className="flex-1 divide-y divide-zinc-100">
        {months.map((m) => {
          const cash = m.revenue - m.spend;
          const current = m.key === currentKey;
          return (
            <div
              key={m.key}
              className={`grid grid-cols-[2.5rem_1fr_1fr] gap-2 px-3 py-[5px] text-xs tabular-nums ${current ? "bg-blue-50/60" : ""}`}
            >
              <span className={current ? "font-semibold text-zinc-900" : "text-zinc-500"}>{m.label}</span>
              <span className={`text-right ${m.revenue > 0 ? "font-medium text-zinc-800" : "text-zinc-400"}`}>{brl(m.revenue)}</span>
              <span className={`text-right font-medium ${tone(cash)}`}>{brl(cash)}</span>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-[2.5rem_1fr_1fr] gap-2 border-t border-zinc-200 bg-zinc-50/60 px-3 py-2 text-xs font-semibold tabular-nums">
        <span className="text-zinc-700">Ano</span>
        <span className="text-right text-zinc-900">{brl(totalRevenue)}</span>
        <span className={`text-right ${tone(totalCash)}`}>{brl(totalCash)}</span>
      </div>
    </section>
  );
}
