"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

export type Theme = "light" | "dark";

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("caros-theme", theme);
  } catch {
    // armazenamento bloqueado — o tema vale só até fechar a página
  }
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);
  const pick = (t: Theme) => {
    setTheme(t);
    applyTheme(t);
  };
  return [theme, pick];
}

/** Sol/lua no topo, ao lado do avatar: um clique alterna o tema. */
export function ThemeToggle() {
  const [theme, pick] = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      aria-label={dark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      title={dark ? "Modo claro" : "Modo escuro"}
      onClick={() => pick(dark ? "light" : "dark")}
      className="grid size-8 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

/** Par de ícones sol/lua (Configurações): o ativo fica destacado. */
export function ThemeIconPicker() {
  const [theme, pick] = useTheme();
  const btn = (t: Theme, Icon: typeof Sun, label: string) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => pick(t)}
      className={cn(
        "grid size-10 place-items-center rounded-full border transition-colors",
        theme === t
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
      )}
    >
      <Icon size={17} />
    </button>
  );
  return (
    <div className="flex items-center gap-2">
      {btn("light", Sun, "Modo claro")}
      {btn("dark", Moon, "Modo escuro")}
    </div>
  );
}
