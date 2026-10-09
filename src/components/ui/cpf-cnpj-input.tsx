"use client";

import { useState } from "react";
import { Input } from "./field";

/** 000.000.000-00 (até 11 dígitos) ou 00.000.000/0000-00 (12 a 14 dígitos). */
export function formatCpfCnpj(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

interface CpfCnpjInputProps {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
}

/** Campo de CPF/CNPJ: só números, no máximo 14 dígitos, formata enquanto digita. */
export function CpfCnpjInput({ name, defaultValue, placeholder = "000.000.000-00", required }: CpfCnpjInputProps) {
  const [value, setValue] = useState(formatCpfCnpj(defaultValue ?? ""));
  return (
    <Input
      name={name}
      value={value}
      onChange={(e) => setValue(formatCpfCnpj(e.target.value))}
      inputMode="numeric"
      maxLength={18}
      required={required}
      minLength={required ? 14 : undefined}
      placeholder={placeholder}
    />
  );
}
