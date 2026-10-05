import { brl } from "@/lib/format";
import type { CashMonth } from "@/lib/queries/finance";

/**
 * Entradas (verde) × saídas (vermelho) mês a mês, na mesma escala, com o
 * resultado (positivo/negativo) embaixo de cada mês.
 * Par verde/vermelho validado para daltonismo sobre fundo claro (ΔE deutan 9,6
 * + reforço de legenda, gaps e rótulos).
 */
export function CashflowChart({ months }: { months: CashMonth[] }) {
  const max = Math.max(...months.map((m) => m.inflow), ...months.map((m) => m.outflow), 1);
  const h = (n: number) => `${Math.max((n / max) * 100, n > 0 ? 2 : 0)}%`;

  const current = months[months.length - 1];
  const currentNet = current ? current.inflow - current.outflow : 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-zinc-900">Entradas × saídas por mês</h3>
        <div className="flex items-center gap-4 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-600" />
            Entradas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-red-500" />
            Saídas
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-end gap-1.5 sm:gap-2">
        {months.map((m) => {
          const net = m.inflow - m.outflow;
          const empty = m.inflow === 0 && m.outflow === 0;
          const hint = empty
            ? `${m.label} — sem movimentação`
            : `${m.label} — Entradas ${brl(m.inflow)} · Saídas ${brl(m.outflow)} · Resultado ${brl(net)}`;
          return (
            <div key={m.key} className="flex min-w-0 flex-1 flex-col items-stretch" title={hint}>
              <div className="flex h-32 items-end justify-center gap-[2px]">
                {empty ? (
                  <div className="h-[2px] w-full rounded-full bg-zinc-100" />
                ) : (
                  <>
                    <div className="w-full max-w-4 rounded-t-[3px] bg-emerald-600" style={{ height: h(m.inflow) }} />
                    <div className="w-full max-w-4 rounded-t-[3px] bg-red-500" style={{ height: h(m.outflow) }} />
                  </>
                )}
              </div>
              <span className="mt-1.5 truncate text-center text-[10px] text-zinc-400">{m.label}</span>
              <span
                className={`truncate text-center text-[10px] font-medium tabular-nums ${
                  empty ? "text-zinc-200" : net >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {empty ? "·" : net >= 0 ? "+" : "−"}
              </span>
            </div>
          );
        })}
      </div>

      {current && (
        <p className="mt-3 border-t border-zinc-100 pt-2.5 text-[11px] text-zinc-500">
          Mês atual ({current.label}):{" "}
          <strong className={`font-semibold ${currentNet >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {currentNet >= 0 ? "positivo" : "negativo"} em {brl(Math.abs(currentNet))}
          </strong>{" "}
          — entradas {brl(current.inflow)} · saídas {brl(current.outflow)}
        </p>
      )}
    </div>
  );
}
