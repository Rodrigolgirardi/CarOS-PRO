"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/field";

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

interface MonthSelectProps {
  /** anos disponíveis (2026 até o ano atual) */
  years: number[];
  /** mês ativo no filtro, formato YYYY-MM */
  active: string;
}

/** Filtro único do fluxo de caixa: mês num seletor, ano no outro. */
export function MonthSelect({ years, active }: MonthSelectProps) {
  const router = useRouter();
  const [year, setYear] = useState(Number(active.slice(0, 4)));
  const go = (y: number, m: string) => router.push(`/financeiro?tab=caixa&mes=${y}-${m}`);

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-[5.5rem]">
        <Select
          value={active.slice(5, 7)}
          aria-label="Filtrar por mês"
          onChange={(e) => go(year, e.target.value)}
          className="h-8 px-2 text-xs"
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
          aria-label="Filtrar por ano"
          onChange={(e) => {
            const y = Number(e.target.value);
            setYear(y);
            go(y, active.slice(5, 7));
          }}
          className="h-8 px-2 text-xs"
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
