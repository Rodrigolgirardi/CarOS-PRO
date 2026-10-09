"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { AD_PLATFORMS } from "@/lib/labels";
import { cn } from "@/lib/cn";

interface PlatformsHoverProps {
  /** nomes das plataformas onde o carro está anunciado, separados por "|" */
  list: string | null;
}

/**
 * Selo "3/7" com as plataformas do anúncio; ao passar o mouse abre um popup
 * com as cadastradas e as que faltam. O popup é "fixed" (via portal) para não
 * ser cortado pela rolagem horizontal da tabela.
 */
export function PlatformsHover({ list }: PlatformsHoverProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const done = new Set((list ?? "").split("|").filter(Boolean));
  const count = AD_PLATFORMS.filter((p) => done.has(p)).length;
  const total = AD_PLATFORMS.length;

  const open = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, left: r.left });
  };

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={open}
        onMouseLeave={() => setPos(null)}
        className={cn(
          "inline-flex cursor-default items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
          count === 0
            ? "bg-red-50 text-red-600"
            : count === total
              ? "bg-emerald-50 text-emerald-700"
              : "bg-blue-50 text-blue-700"
        )}
      >
        {count}/{total}
      </span>
      {pos &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 w-52 animate-[pop-in_.12s_ease-out] rounded-xl border border-zinc-200 bg-white p-3 shadow-xl shadow-black/10"
            style={{ top: pos.top, left: pos.left }}
          >
            <p className="mb-2 text-xs font-semibold text-zinc-900">
              Anunciado em {count} de {total}
            </p>
            <ul className="space-y-1">
              {AD_PLATFORMS.map((p) => {
                const ok = done.has(p);
                return (
                  <li key={p} className="flex items-center gap-2 text-xs">
                    {ok ? (
                      <Check size={13} className="shrink-0 text-emerald-600" />
                    ) : (
                      <X size={13} className="shrink-0 text-zinc-400" />
                    )}
                    <span className={ok ? "font-medium text-zinc-800" : "text-zinc-400"}>{p}</span>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body
        )}
    </>
  );
}
