"use client";

import { ThemeIconPicker } from "@/components/layout/theme-toggle";

/** Aparência: sol/lua, lembrado por navegador (cada computador escolhe o seu). */
export function AppearanceForm() {
  return (
    <section>
      <header className="border-b border-zinc-100 px-5 py-3">
        <h3 className="text-[13px] font-semibold text-zinc-900">Aparência</h3>
      </header>
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <p className="text-xs text-zinc-500">A escolha fica salva neste navegador.</p>
        <ThemeIconPicker />
      </div>
    </section>
  );
}
