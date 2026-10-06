"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import type { VehicleOption } from "@/lib/queries/vehicles";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";

interface ExtractFiltersProps {
  vehicles: VehicleOption[]; // inclui vendidos
  data: string | null;
  veiculo: string | null;
  busca: string | null;
}

/** Filtros do extrato: dia exato, carro e busca por placa/descrição (combináveis). */
export function ExtractFilters({ vehicles, data, veiculo, busca }: ExtractFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    next.set("tab", "caixa");
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.push(`/financeiro?${next.toString()}`);
  };

  const active = data || veiculo || busca;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className="w-36">
        <Input
          type="date"
          aria-label="Filtrar por data"
          value={data ?? ""}
          onChange={(e) => apply({ data: e.target.value || null })}
          className="h-7 text-xs"
        />
      </div>
      <div className="w-44">
        <Select
          aria-label="Filtrar por carro"
          value={veiculo ?? ""}
          onChange={(e) => apply({ veiculo: e.target.value || null })}
          className="h-7 text-xs"
        >
          <option value="">Todos os carros</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="relative w-56">
        <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" />
        <Input
          aria-label="Buscar por placa ou descrição"
          placeholder="Buscar placa ou descrição…"
          defaultValue={busca ?? ""}
          onChange={(e) => {
            if (debounce.current) clearTimeout(debounce.current);
            const value = e.target.value;
            debounce.current = setTimeout(() => apply({ busca: value.trim() || null }), 400);
          }}
          className="h-7 pl-7 text-xs"
        />
      </div>
      {active && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => apply({ data: null, veiculo: null, busca: null })}
        >
          <X size={12} />
          Limpar
        </Button>
      )}
    </div>
  );
}
