"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/field";

/** Lupa do extrato: busca por placa ou palavra-chave (corolla, gol, lavagem…). */
export function ExtractSearch({ busca }: { busca: string | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const apply = (value: string | null) => {
    const next = new URLSearchParams(params.toString());
    next.set("tab", "caixa");
    if (value) next.set("busca", value);
    else next.delete("busca");
    router.push(`/financeiro?${next.toString()}`);
  };

  return (
    <div className="relative min-w-0 flex-1 sm:max-w-xs">
      <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
      <Input
        ref={inputRef}
        aria-label="Buscar por placa ou palavra-chave"
        placeholder="Buscar placa, corolla, lavagem…"
        defaultValue={busca ?? ""}
        onChange={(e) => {
          if (debounce.current) clearTimeout(debounce.current);
          const value = e.target.value;
          debounce.current = setTimeout(() => apply(value.trim() || null), 400);
        }}
        className="h-10 lg:h-8 pl-8 pr-8 text-[13px] lg:pl-8! lg:pr-8!"
      />
      {busca && (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "";
            apply(null);
          }}
          className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-zinc-400 hover:text-zinc-700"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
