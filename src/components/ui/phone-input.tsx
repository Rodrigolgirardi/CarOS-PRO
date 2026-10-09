"use client";

import { Input } from "@/components/ui/field";

/** Formata enquanto digita e trava em 11 dígitos: (11) 99999-0000. */
function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function PhoneInput({ defaultValue, onChange, ...props }: React.ComponentProps<"input">) {
  return (
    <Input
      type="tel"
      inputMode="tel"
      maxLength={15}
      defaultValue={typeof defaultValue === "string" ? maskPhone(defaultValue) : defaultValue}
      onChange={(e) => {
        e.target.value = maskPhone(e.target.value);
        onChange?.(e);
      }}
      {...props}
    />
  );
}
