"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("caros-theme", theme);
  } catch {
    // armazenamento bloqueado — o tema vale só até fechar a página
  }
}

/** Aparência: claro/escuro, lembrado por navegador (cada computador escolhe o seu). */
export function AppearanceForm() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const pick = (t: Theme) => {
    setTheme(t);
    applyTheme(t);
  };

  const option = (t: Theme, label: string, Icon: typeof Sun) => (
    <button
      type="button"
      onClick={() => pick(t)}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-[13px] font-medium transition-colors",
        theme === t
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
      )}
    >
      <Icon size={15} />
      {label}
    </button>
  );

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <header className="border-b border-zinc-100 px-5 py-3">
        <h3 className="text-[13px] font-semibold text-zinc-900">Aparência</h3>
      </header>
      <div className="space-y-3 px-5 py-4">
        <div className="flex gap-2">
          {option("light", "Modo claro", Sun)}
          {option("dark", "Modo escuro", Moon)}
        </div>
        <p className="text-xs text-zinc-400">A escolha fica salva neste navegador — cada computador pode ter a sua.</p>
      </div>
    </section>
  );
}
