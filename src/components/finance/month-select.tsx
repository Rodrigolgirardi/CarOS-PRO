"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/field";

interface MonthSelectProps {
  months: { key: string; label: string }[];
  active: string | null;
}

/** Filtro de mês fechado do fluxo de caixa (jan/2026 em diante). */
export function MonthSelect({ months, active }: MonthSelectProps) {
  const router = useRouter();
  return (
    <div className="w-44">
      <Select
        value={active ?? ""}
        aria-label="Filtrar por mês"
        onChange={(e) => {
          const v = e.target.value;
          router.push(v ? `/financeiro?tab=caixa&mes=${v}` : "/financeiro?tab=caixa");
        }}
        className="h-7 text-xs"
      >
        <option value="">Escolher mês…</option>
        {months.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
