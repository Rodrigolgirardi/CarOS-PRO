"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

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
