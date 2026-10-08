import {
  BadgePercent,
  Car,
  FileText,
  Handshake,
  LayoutDashboard,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItemData {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const MAIN: NavItemData[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/veiculos", label: "Veículos", icon: Car },
  { href: "/vendas", label: "Vendas", icon: Handshake },
  { href: "/vendedores", label: "Vendedores", icon: BadgePercent },
];

export const MANAGE: NavItemData[] = [
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/documentos", label: "Documentos", icon: FileText },
];
