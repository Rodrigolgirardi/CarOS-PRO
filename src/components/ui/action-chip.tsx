import { ChevronRight, type LucideIcon } from "lucide-react";

/** Paleta dos chips de ação (mesmo visual das Ações rápidas do dashboard). */
const COLORS = {
  violet: { outer: "border-violet-100 bg-violet-50 text-violet-700 hover:bg-violet-100", icon: "bg-violet-600" },
  emerald: { outer: "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100", icon: "bg-emerald-600" },
  orange: { outer: "border-orange-100 bg-orange-50 text-orange-700 hover:bg-orange-100", icon: "bg-orange-500" },
  blue: { outer: "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100", icon: "bg-blue-600" },
  red: { outer: "border-red-100 bg-red-50 text-red-600 hover:bg-red-100", icon: "bg-red-500" },
} as const;

export type ChipColor = keyof typeof COLORS;

export function chipCls(color: ChipColor, className?: string) {
  return `flex w-full items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-[13px] font-semibold transition-colors ${COLORS[color].outer}${className ? ` ${className}` : ""}`;
}

export function ChipInner({
  icon: Icon,
  label,
  color,
  compact,
}: {
  icon: LucideIcon;
  label: string;
  color: ChipColor;
  /** só ícone pequeno + texto, centralizado — para caber 4 por linha */
  compact?: boolean;
}) {
  if (compact) {
    return (
      <span className="flex min-w-0 items-center justify-center gap-1.5">
        <Icon size={14} className="shrink-0" />
        <span className="truncate">{label}</span>
      </span>
    );
  }
  return (
    <>
      <span className="flex min-w-0 items-center gap-2.5">
        <span className={`grid size-7 shrink-0 place-items-center rounded-lg text-white ${COLORS[color].icon}`}>
          <Icon size={15} />
        </span>
        <span className="truncate">{label}</span>
      </span>
      <ChevronRight size={14} className="shrink-0 opacity-50" />
    </>
  );
}
