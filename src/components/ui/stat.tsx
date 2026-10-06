import { cn } from "@/lib/cn";

interface StatProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  valueClassName?: string;
}

/** Número de destaque: rótulo em cima, valor grande tabular, contexto embaixo. */
export function Stat({ label, value, sub, valueClassName }: StatProps) {
  return (
    <div className="flex min-w-0 flex-col justify-center bg-white px-5 py-4">
      <p className="truncate text-xs font-medium text-zinc-500">{label}</p>
      {/* a cor padrão só entra quando não há cor customizada (evita conflito de precedência CSS) */}
      <p className={cn("mt-1.5 text-xl font-semibold tracking-tight tabular-nums", valueClassName ?? "text-zinc-900")}>
        {value}
      </p>
      {sub != null && <p className="mt-0.5 truncate text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

/**
 * Faixa de stats com divisórias finas (gap-px sobre fundo cinza),
 * seguras mesmo quando as colunas quebram em telas menores.
 */
export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100", className)}>
      {children}
    </div>
  );
}
