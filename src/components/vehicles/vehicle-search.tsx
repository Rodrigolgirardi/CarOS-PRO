"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/field";

/** Busca de veículos por marca, modelo ou placa. */
export function VehicleSearch({ busca }: { busca: string | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const apply = (value: string | null) => {
    // preserva ?filtro= (e demais parâmetros) ao escrever ?busca=
    const next = new URLSearchParams(params.toString());
    if (value) next.set("busca", value);
    else next.delete("busca");
    const qs = next.toString();
    router.push(qs ? `/veiculos?${qs}` : "/veiculos");
  };

  return (
    <div className="relative">
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
      <Input
        ref={inputRef}
        aria-label="Buscar veículos"
        placeholder="Buscar por marca, modelo ou placa…"
        defaultValue={busca ?? ""}
        onChange={(e) => {
          if (debounce.current) clearTimeout(debounce.current);
          const value = e.target.value;
          debounce.current = setTimeout(() => apply(value.trim() || null), 400);
        }}
        className="h-10 rounded-md bg-zinc-50 pl-9 pr-8 text-[13px] lg:h-8"
      />
      {busca && (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "";
            apply(null);
          }}
          className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-zinc-400 hover:text-zinc-700"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
