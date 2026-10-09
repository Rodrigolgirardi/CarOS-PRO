"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { centsToInput, parseBRL } from "@/lib/format";
import { controlCls } from "./field";

/** Normaliza a digitação para o formato brasileiro: 79.900 / 79.900,50 */
export function formatMoneyTyping(raw: string): string {
  let v = raw.replace(/[^\d,]/g, "");
  const firstComma = v.indexOf(",");
  if (firstComma !== -1) {
    v = v.slice(0, firstComma + 1) + v.slice(firstComma + 1).replace(/,/g, "").slice(0, 2);
  }
  const [int = "", dec] = v.split(",");
  const grouped = int.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return dec !== undefined ? `${grouped},${dec}` : grouped;
}

interface CurrencyInputProps {
  name?: string;
  defaultCents?: number | null;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
  /** Para simuladores: notifica o valor em centavos a cada digitação. */
  onCentsChange?: (cents: number | null) => void;
}

export function CurrencyInput({
  name,
  defaultCents,
  placeholder = "0",
  required,
  autoFocus,
  className,
  onCentsChange,
}: CurrencyInputProps) {
  const [value, setValue] = useState(defaultCents != null ? centsToInput(defaultCents) : "");

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-zinc-400">
        R$
      </span>
      <input
        type="text"
        inputMode="decimal"
        name={name}
        value={value}
        required={required}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => {
          const formatted = formatMoneyTyping(e.target.value);
          setValue(formatted);
          onCentsChange?.(parseBRL(formatted));
        }}
        className={cn(controlCls, "pl-8 tabular-nums lg:pl-8!")}
      />
    </div>
  );
}
