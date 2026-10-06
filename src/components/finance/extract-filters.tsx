"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import type { VehicleOption } from "@/lib/queries/vehicles";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";

interface ExtractFiltersProps {
  vehicles: VehicleOption[]; // inclui vendidos
  data: string | null;
  veiculo: string | null;
  placa: string | null;
}

/** Filtros do extrato: dia exato, carro e placa (combináveis). */
export function ExtractFilters({ vehicles, data, veiculo, placa }: ExtractFiltersProps) {
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

  const active = data || veiculo || placa;

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
          onChange={(e) => apply({ veiculo: e.target.value || null, placa: null })}
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
      <div className="w-28">
        <Input
          aria-label="Filtrar por placa"
          placeholder="Placa…"
          defaultValue={placa ?? ""}
          onChange={(e) => {
            if (debounce.current) clearTimeout(debounce.current);
            const value = e.target.value;
            debounce.current = setTimeout(() => apply({ placa: value.trim() || null, veiculo: null }), 400);
          }}
          className="h-7 font-mono text-xs uppercase"
        />
      </div>
      {active && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => apply({ data: null, veiculo: null, placa: null })}
        >
          <X size={12} />
          Limpar
        </Button>
      )}
    </div>
  );
}
