import {
  BadgePercent,
  Car,
  FileText,
  Handshake,
  LayoutDashboard,
  ListTodo,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItemData {
  href: string;
  label: string;
  icon: LucideIcon;
  /** nome/ícone na barra lateral do desktop, quando diferente do celular */
  desktopLabel?: string;
  desktopIcon?: LucideIcon;
  /** só na barra lateral do computador (o celular acessa pelo menu do perfil) */
  desktopOnly?: boolean;
}

export const MAIN: NavItemData[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/veiculos", label: "Veículos", icon: Car },
  { href: "/vendas", label: "Vendas", icon: Handshake, desktopLabel: "Clientes", desktopIcon: Users },
  { href: "/tarefas", label: "Minhas tarefas", icon: ListTodo, desktopOnly: true },
  { href: "/vendedores", label: "Vendedores", icon: BadgePercent },
];

export const MANAGE: NavItemData[] = [
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/configuracoes", label: "Configurações", icon: Settings, desktopOnly: true },
];
