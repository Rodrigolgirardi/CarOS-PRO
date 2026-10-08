import {
  BadgePercent,
  Car,
  Database,
  FileText,
  Handshake,
  LayoutDashboard,
  Users,
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
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/vendedores", label: "Vendedores", icon: BadgePercent },
];

export const MANAGE: NavItemData[] = [
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/banco-de-dados", label: "Banco de dados", icon: Database },
];
