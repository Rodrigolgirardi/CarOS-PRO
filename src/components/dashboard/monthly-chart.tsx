"use client";

import { useState } from "react";
import { brl } from "@/lib/format";
import type { MonthlyPoint } from "@/lib/queries/dashboard";

/**
 * Resultado mensal: faturamento (azul), custos (vermelho) e lucro (verde)
 * dos últimos 12 meses, na mesma escala, com eixo em valores "redondos".
 * Lucro negativo desce abaixo da linha zero. Trio validado para daltonismo.
 * Tocar numa coluna seleciona o mês e mostra o resumo abaixo do gráfico.
 */
export function MonthlySalesChart({
  months,
  action,
  netLabel = "Lucro",
}: {
  months: MonthlyPoint[];
  action?: React.ReactNode;
  /** nome da 3ª série (faturamento − custos): "Caixa" no desktop, que é visão de fluxo de caixa */
  netLabel?: string;
}) {
  const net = (m: MonthlyPoint) => m.revenue - m.spend;
  const hasMove = (m: MonthlyPoint) => m.revenue !== 0 || m.spend !== 0;

  // mês atual começa selecionado se tiver movimentação; toque alterna a seleção
  const [selected, setSelected] = useState<string | null>(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const cur = months.find((m) => m.key === key);
    return cur && hasMove(cur) ? cur.key : null;
  });
  const sel = selected ? (months.find((m) => m.key === selected) ?? null) : null;
  const toggle = (key: string) => setSelected((s) => (s === key ? null : key));

  const rawMax = Math.max(
    ...months.map((m) => m.revenue),
    ...months.map((m) => m.spend),
    ...months.map((m) => Math.max(net(m), 0)),
    1
  );
  const rawNeg = Math.max(...months.map((m) => Math.max(-net(m), 0)), 0);

  // passo "redondo" (1/2/2,5/5 × 10^n) que cobre o maior valor em até 3 degraus
  const niceStep = (v: number) => {
    const target = v / 3;
    const mag = 10 ** Math.floor(Math.log10(Math.max(target, 1)));
    for (const mult of [1, 2, 2.5, 5, 10]) {
      if (mag * mult >= target) return mag * mult;
    }
    return mag * 10;
  };
  const step = niceStep(rawMax);
  const stepsUp = Math.max(Math.ceil(rawMax / step), 1);
  const stepsDown = rawNeg > 0 ? Math.max(Math.ceil(rawNeg / step), 1) : 0;
  const top = stepsUp * step;
  const bottom = stepsDown * step;
  const abovePct = (top / (top + bottom)) * 100;
  const belowPct = 100 - abovePct;

  // rótulo curto do eixo: 120 mil, 40 mil, 0… (valores em centavos)
  const axisLabel = (cents: number) => {
    const v = cents / 100;
    if (v === 0) return "0";
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
    if (Math.abs(v) >= 1000) return `${Math.round(v / 1000)} mil`;
    return String(Math.round(v));
  };
  const ticks: number[] = [];
  for (let i = stepsUp; i >= -stepsDown; i--) ticks.push(i * step);

  const sold = months.filter((m) => m.sales > 0);
  const best = sold.length > 0 ? sold.reduce((a, b) => (b.revenue > a.revenue ? b : a)) : null;
  const worst = sold.length > 1 ? sold.reduce((a, b) => (b.revenue < a.revenue ? b : a)) : null;

  const Slot = ({ up, down, cls, downCls }: { up: number; down: number; cls: string; downCls?: string }) => (
    <div className="flex w-full max-w-3.5 flex-col">
      <div className="flex items-end justify-center" style={{ height: `${abovePct}%` }}>
        {up > 0 && <div className={`w-full rounded-t-[3px] ${cls}`} style={{ height: `${Math.max((up / top) * 100, 2)}%` }} />}
      </div>
      {belowPct > 0 && (
        <div className="flex items-start justify-center" style={{ height: `${belowPct}%` }}>
          {down > 0 && (
            <div
              className={`w-full rounded-b-[3px] ${downCls ?? cls}`}
              style={{ height: `${Math.max((down / bottom) * 100, 4)}%` }}
            />
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold tracking-tight text-zinc-900">Resultado mensal</h3>
        {action ?? (
          <span className="text-[11px] font-medium text-zinc-500">{months[0]?.key.slice(0, 4)}</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-blue-600" />
          Faturamento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-500" />
          Custos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-600" />
          {netLabel}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        {/* eixo Y com valores redondos */}
        <div className="relative h-32 w-10 shrink-0 text-right">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2 text-[11px] tabular-nums text-zinc-500"
              style={{ top: `${((top - t) / (top + bottom)) * 100}%` }}
            >
              {axisLabel(t)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-32">
            {/* linhas de grade, casadas com o eixo */}
            {ticks.map((t) => (
              <div
                key={t}
                className={`absolute inset-x-0 border-t ${t === 0 ? "border-zinc-300" : "border-zinc-100"}`}
                style={{ top: `${((top - t) / (top + bottom)) * 100}%` }}
              />
            ))}
            <div className="absolute inset-0 flex items-stretch gap-1 sm:gap-2">
              {months.map((m) => {
                const lucro = net(m);
                const empty = !hasMove(m);
                const hint = empty
                  ? `${m.label} — sem movimentação`
                  : `${m.label} — Faturamento ${brl(m.revenue)} (${m.sales} venda(s)) · Custos ${brl(m.spend)} · ${netLabel} ${brl(lucro)}`;
                const isSel = selected === m.key;
                return (
                  <div
                    key={m.key}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSel}
                    onClick={() => toggle(m.key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggle(m.key);
                      }
                    }}
                    className={`flex min-w-0 flex-1 cursor-pointer justify-center gap-[2px] rounded-md transition ${
                      isSel ? "bg-zinc-900/[0.04] ring-1 ring-inset ring-zinc-300" : selected ? "opacity-40" : ""
                    }`}
                    title={hint}
                  >
                    {!empty && (
                      <>
                        <Slot up={m.revenue} down={0} cls="bg-blue-600" />
                        <Slot up={m.spend} down={0} cls="bg-red-500" />
                        <Slot up={Math.max(lucro, 0)} down={Math.max(-lucro, 0)} cls="bg-emerald-600" downCls="bg-red-700" />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-1.5 flex gap-1 sm:gap-2">
            {months.map((m) => (
              <span
                key={m.key}
                onClick={() => toggle(m.key)}
                className={`min-w-0 flex-1 cursor-pointer truncate text-center text-[11px] ${
                  selected === m.key ? "font-semibold text-zinc-900" : "text-zinc-500"
                }`}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {sel && (
        <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-[12px] text-zinc-600">
          <strong className="font-semibold text-zinc-800">{sel.label}</strong>
          {!hasMove(sel) ? (
            <> · sem movimentação</>
          ) : (
            <>
              {" "}
              · Faturamento <span className="font-medium tabular-nums text-zinc-800">{brl(sel.revenue)}</span> ({sel.sales}{" "}
              venda(s)) · Custos <span className="font-medium tabular-nums text-zinc-800">{brl(sel.spend)}</span> · {netLabel}{" "}
              <span className={`font-semibold tabular-nums ${net(sel) >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {brl(net(sel))}
              </span>
            </>
          )}
        </p>
      )}

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
