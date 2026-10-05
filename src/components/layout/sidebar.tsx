"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Car,
  FileText,
  Handshake,
  LayoutDashboard,
  Percent,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";

const MAIN = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/veiculos", label: "Veículos", icon: Car },
  { href: "/compras", label: "Compras", icon: ShoppingCart },
  { href: "/vendas", label: "Vendas", icon: Handshake },
  { href: "/clientes", label: "Clientes", icon: Users },
];

const MANAGE = [
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/comissao", label: "Comissão", icon: Percent },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

function NavItem({ href, label, icon: Icon }: (typeof MAIN)[number]) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
        active ? "bg-zinc-200/60 text-zinc-900" : "text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-900"
      )}
    >
      <Icon size={15} strokeWidth={1.75} className={cn("shrink-0", active ? "text-zinc-700" : "text-zinc-400")} />
      {label}
    </Link>
  );
}

export function Sidebar({ children }: { children?: React.ReactNode }) {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50/70">
      <div className="flex items-center gap-2.5 px-4 pb-5 pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/caros-mark.png" alt="" className="size-7 shrink-0 rounded-md object-cover" />
        <span className="text-[15px] font-semibold tracking-tight text-zinc-900">CarOS</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2.5 pb-4">
        <div className="space-y-0.5">
          {MAIN.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
        <div className="mx-2 my-3 border-t border-zinc-200/80" />
        <div className="space-y-0.5">
          {MANAGE.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
      </nav>
      {children && <div className="px-2.5 pb-3">{children}</div>}
    </aside>
  );
}
