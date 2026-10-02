import Link from "next/link";
import { cn } from "@/lib/cn";

export interface LinkTab {
  key: string;
  label: string;
  href: string;
  count?: number | null;
}

/** Abas por link (estado na URL — recarregável e compartilhável). */
export function LinkTabs({ tabs, activeKey, className }: { tabs: LinkTab[]; activeKey: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5 overflow-x-auto border-b border-zinc-200", className)}>
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={cn(
              "-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-2 text-[13px] transition-colors",
              active
                ? "border-zinc-900 font-medium text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            )}
          >
            {t.label}
            {t.count != null && (
              <span className="rounded-full bg-zinc-100 px-1.5 py-px text-[11px] tabular-nums text-zinc-500">
                {t.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export interface Chip {
  key: string;
  label: string;
  href: string;
  count?: number | null;
}

/** Filtros em pílulas (período, status…). */
export function Chips({ items, activeKey, className }: { items: Chip[]; activeKey: string; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {items.map((c) => {
        const active = c.key === activeKey;
        return (
          <Link
            key={c.key}
            href={c.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
            )}
          >
            {c.label}
            {c.count != null && (
              <span className={cn("tabular-nums", active ? "text-zinc-300" : "text-zinc-400")}>{c.count}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
