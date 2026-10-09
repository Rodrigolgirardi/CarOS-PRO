"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { LogOut, MoreHorizontal, Settings, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { logout } from "@/lib/actions/settings";
import { MAIN, MANAGE, type NavItemData } from "@/components/layout/nav-items";

const ALL = [...MAIN, ...MANAGE].filter((i) => !i.desktopOnly);
const TAB_HREFS = ["/", "/vendas", "/veiculos", "/financeiro"];
// nomes curtos só na barra de baixo (a sidebar do computador mantém os originais)
const TAB_LABELS: Record<string, string> = { "/vendas": "Leads" };
const TABS = TAB_HREFS.map((h) => ALL.find((i) => i.href === h)!)
  .filter(Boolean)
  .map((i) => ({ ...i, label: TAB_LABELS[i.href] ?? i.label }));
const MORE = ALL.filter((i) => !TAB_HREFS.includes(i.href));

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

function TabButton({ item }: { item: NavItemData }) {
  const pathname = usePathname();
  const { href, label, icon: Icon } = item;
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 transition-colors",
        active ? "text-zinc-900" : "text-zinc-500"
      )}
    >
      <Icon size={20} strokeWidth={active ? 2 : 1.75} />
      <span className={cn("text-[11px] leading-none", active ? "font-semibold" : "font-medium")}>{label}</span>
    </Link>
  );
}

/** Barra de abas fixa embaixo (celular): 4 atalhos + "Mais" com o restante. */
export function MobileTabBar() {
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const moreActive = MORE.some((i) => isActive(pathname, i.href));

  // fecha a gaveta "Mais" ao trocar de página
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid h-16 grid-cols-5">
          {TABS.map((item) => (
            <TabButton key={item.href} item={item} />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 transition-colors",
              moreActive || moreOpen ? "text-zinc-900" : "text-zinc-500"
            )}
          >
            <MoreHorizontal size={20} strokeWidth={moreActive ? 2 : 1.75} />
            <span className={cn("text-[11px] leading-none", moreActive ? "font-semibold" : "font-medium")}>Mais</span>
          </button>
        </div>
      </nav>
      {moreOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setMoreOpen(false)} />
            <div className="absolute inset-x-0 bottom-0 animate-[sheet-in_.18s_ease-out] rounded-t-2xl bg-white px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-xl">
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-zinc-200" />
              <div className="mb-1 flex items-center justify-between">
                <h2 className="px-3 text-[15px] font-semibold text-zinc-900">Mais opções</h2>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Fechar"
                  className="grid size-10 place-items-center rounded-full text-zinc-500 transition-colors active:bg-zinc-100"
                >
                  <X size={20} strokeWidth={1.75} />
                </button>
              </div>
              <div className="space-y-1">
                {MORE.map(({ href, label, icon: Icon }) => {
                  const active = isActive(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors",
                        active ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 active:bg-zinc-100"
                      )}
                    >
                      <Icon size={19} strokeWidth={1.75} className={cn("shrink-0", active ? "text-zinc-700" : "text-zinc-400")} />
                      {label}
                    </Link>
                  );
                })}
                <div className="my-1.5 h-px bg-zinc-100" />
                <Link
                  href="/configuracoes"
                  className={cn(
                    "flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors",
                    isActive(pathname, "/configuracoes")
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-600 active:bg-zinc-100"
                  )}
                >
                  <Settings
                    size={19}
                    strokeWidth={1.75}
                    className={cn("shrink-0", isActive(pathname, "/configuracoes") ? "text-zinc-700" : "text-zinc-400")}
                  />
                  Configurações
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-[15px] font-medium text-red-600 transition-colors active:bg-red-50"
                  >
                    <LogOut size={19} strokeWidth={1.75} className="shrink-0" />
                    Sair
                  </button>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
