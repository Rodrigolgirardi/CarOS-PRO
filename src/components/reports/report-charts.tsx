import { BrandLogo } from "@/components/vehicles/brand-logo";

/** Card do relatório no mesmo desenho das tabelas de Leads/Consignantes/Compradores. */
export function ReportCard({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/60 px-4 py-2">
        <h2 className="text-xs font-medium text-zinc-500">{title}</h2>
        {aside && <span className="truncate text-xs text-zinc-500">{aside}</span>}
      </div>
      <div className="flex-1 px-4 py-4">{children}</div>
    </section>
  );
}

export function EmptyChart({ children }: { children: React.ReactNode }) {
  return <p className="grid h-full min-h-40 place-items-center text-center text-[13px] text-zinc-400">{children}</p>;
}

// paleta das fatias (variáveis do tema: funcionam no claro e no escuro)
const SLICE_COLORS = [
  "var(--color-violet-500)",
  "var(--color-blue-500)",
  "var(--color-emerald-500)",
  "var(--color-amber-400)",
  "var(--color-red-500)",
  "var(--color-teal-400)",
  "var(--color-zinc-400)",
];

/** Rosca com legenda: cada fatia é a fatia do total (ex.: leads por canal). */
export function DonutChart({ data, unit }: { data: { label: string; value: number }[]; unit: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90">
          <circle cx="70" cy="70" r={R} fill="none" stroke="var(--color-zinc-100)" strokeWidth="18" />
          {data.map((d, i) => {
            const len = total > 0 ? (d.value / total) * C : 0;
            const el = (
              <circle
                key={d.label}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={SLICE_COLORS[i % SLICE_COLORS.length]}
                strokeWidth="18"
                strokeDasharray={`${Math.max(len - 1.5, 0)} ${C}`}
                strokeDashoffset={-offset}
              >
                <title>{`${d.label}: ${d.value} ${unit} (${Math.round((d.value / total) * 100)}%)`}</title>
              </circle>
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <span>
            <span className="block text-xl font-semibold tabular-nums text-zinc-900">{total}</span>
            <span className="block text-[11px] text-zinc-500">{unit}</span>
          </span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2 text-[13px]">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate text-zinc-700">{d.label}</span>
            <span className="font-medium tabular-nums text-zinc-900">{d.value}</span>
            <span className="w-9 text-right text-xs tabular-nums text-zinc-500">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barras horizontais com rótulo, logo opcional e valor à direita; a primeira pode vir destacada. */
export function HBarChart({
  data,
  color = "bg-blue-500",
  highlightFirst,
}: {
  data: { label: string; value: number; brand?: string; right: React.ReactNode; title?: string }[];
  color?: string;
  highlightFirst?: boolean;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li key={d.label} title={d.title}>
          <div className="mb-1 flex items-center justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2">
              {d.brand && <BrandLogo brand={d.brand} size={15} />}
              <span className={`truncate ${highlightFirst && i === 0 ? "font-semibold text-zinc-900" : "text-zinc-700"}`}>
                {d.label}
              </span>
            </span>
            <span className="shrink-0 text-xs tabular-nums text-zinc-500">{d.right}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full ${highlightFirst && i === 0 ? "bg-emerald-500" : color}`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Colunas por mês (jan–dez); o melhor mês fica em verde. */
export function MonthBars({
  months,
  bestIdx,
}: {
  months: { label: string; value: number; title: string }[];
  bestIdx: number;
}) {
  const max = Math.max(...months.map((m) => m.value), 1);
  return (
    <div className="grid grid-cols-12 items-end gap-2">
      {months.map((m, i) => (
        <div key={m.label} className="flex flex-col items-center gap-1.5" title={m.title}>
          <span
            className={`text-[11px] font-semibold tabular-nums ${
              i === bestIdx ? "text-emerald-600" : m.value ? "text-zinc-700" : "text-zinc-300"
            }`}
          >
            {m.value}
          </span>
          <div className="flex h-32 w-full items-end">
            <div
              className={`w-full rounded-t-md ${i === bestIdx ? "bg-emerald-500" : m.value ? "bg-blue-500" : "bg-zinc-100"}`}
              style={{ height: m.value ? `${(m.value / max) * 100}%` : "4px" }}
            />
          </div>
          <span className={`text-[11px] ${i === bestIdx ? "font-semibold text-emerald-600" : "text-zinc-500"}`}>
            {m.label}
          </span>
        </div>
      ))}
    </div>
  );
}
