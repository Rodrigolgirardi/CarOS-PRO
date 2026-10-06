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
  active: string | null;
}

/** Filtro do fluxo de caixa: mês num seletor, ano no outro. */
export function MonthSelect({ years, active }: MonthSelectProps) {
  const router = useRouter();
  const [year, setYear] = useState(active ? Number(active.slice(0, 4)) : years[years.length - 1]);
  const go = (y: number, m: string) =>
    router.push(m ? `/financeiro?tab=caixa&mes=${y}-${m}` : "/financeiro?tab=caixa");

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-36">
        <Select
          value={active && Number(active.slice(0, 4)) === year ? active.slice(5, 7) : ""}
          aria-label="Filtrar por mês"
          onChange={(e) => go(year, e.target.value)}
          className="h-7 text-xs"
        >
          <option value="">Escolher mês…</option>
          {MESES.map((nome, i) => (
            <option key={nome} value={String(i + 1).padStart(2, "0")}>
              {nome}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-20">
        <Select
          value={year}
          aria-label="Filtrar por ano"
          onChange={(e) => {
            const y = Number(e.target.value);
            setYear(y);
            if (active) go(y, active.slice(5, 7)); // mês já escolhido → troca só o ano
          }}
          className="h-7 text-xs"
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
