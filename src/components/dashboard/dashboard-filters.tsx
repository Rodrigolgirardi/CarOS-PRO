"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/field";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function usePatch() {
  const router = useRouter();
  const params = useSearchParams();
  return (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) next.set(k, v);
    router.push(`/?${next.toString()}`);
  };
}

/** Mês + ano do Resumo do mês. */
export function MonthPick({ years, active }: { years: number[]; active: string }) {
  const patch = usePatch();
  const year = Number(active.slice(0, 4));
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-[5.5rem]">
        <Select
          value={active.slice(5, 7)}
          aria-label="Mês do resumo"
          onChange={(e) => patch({ mes: `${year}-${e.target.value}` })}
          className="h-9 lg:h-7 px-2 text-xs"
        >
          {MESES.map((nome, i) => (
            <option key={nome} value={String(i + 1).padStart(2, "0")}>
              {nome}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-[4.75rem]">
        <Select
          value={year}
          aria-label="Ano do resumo"
          onChange={(e) => patch({ mes: `${e.target.value}-${active.slice(5, 7)}` })}
          className="h-9 lg:h-7 px-2 text-xs"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
