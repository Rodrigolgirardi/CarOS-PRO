"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "./sidebar";

interface MobileHeaderProps {
  /** canto direito da barra (tema + perfil, vindos do layout) */
  actions: React.ReactNode;
  /** rodapé da gaveta (aviso de dados de exemplo) */
  children?: React.ReactNode;
}

/** Barra do celular: hambúrguer + marca; o menu abre numa gaveta lateral. */
export function MobileHeader({ actions, children }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // navegar fecha a gaveta
  useEffect(() => setOpen(false), [pathname]);

  // gaveta aberta trava o scroll de trás
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="flex h-12 shrink-0 items-center gap-1.5 border-b border-zinc-100 bg-zinc-50/40 px-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="grid size-9 place-items-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        >
          <Menu size={18} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/caros-mark.png" alt="" className="size-6 shrink-0 rounded-md object-cover" />
        <span className="text-sm font-semibold tracking-tight text-zinc-900">CarOS</span>
        <div className="ml-auto flex items-center gap-1.5">{actions}</div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-zinc-900/30 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-zinc-50 shadow-xl">
            <div className="flex items-center gap-2.5 px-4 pb-4 pt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/caros-mark.png" alt="" className="size-7 shrink-0 rounded-md object-cover" />
              <span className="text-[15px] font-semibold tracking-tight text-zinc-900">CarOS</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="ml-auto grid size-8 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2.5 pb-4">
              <SidebarNav />
            </nav>
            {children && <div className="px-2.5 pb-3">{children}</div>}
          </aside>
        </div>
      )}
    </>
  );
}
