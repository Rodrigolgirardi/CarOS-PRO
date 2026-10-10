import Link from "next/link";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "danger-ghost"
  | "success"
  | "warning"
  | "info"
  | "danger-solid"
  | "violet"
  | "pink"
  | "yellow";
export type ButtonSize = "sm" | "md";

const BASE =
  "inline-flex items-center justify-center rounded-md border font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15 disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-zinc-900 text-white hover:bg-zinc-700",
  secondary: "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900",
  ghost: "border-transparent bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
  danger: "border-zinc-200 bg-white text-red-600 hover:border-red-200 hover:bg-red-50",
  "danger-ghost": "border-transparent bg-transparent text-red-500 hover:bg-red-50 hover:text-red-600",
  success: "border-transparent bg-emerald-600 text-white hover:bg-emerald-500",
  warning: "border-transparent bg-orange-500 text-white hover:bg-orange-400",
  info: "border-transparent bg-blue-600 text-white hover:bg-blue-500",
  "danger-solid": "border-transparent bg-red-600 text-white hover:bg-red-500",
  violet: "border-transparent bg-violet-600 text-white hover:bg-violet-500",
  pink: "border-transparent bg-pink-600 text-white hover:bg-pink-500",
  // texto yellow-950 (não zinc-900) para continuar escuro no modo escuro, que inverte os zinc
  yellow: "border-transparent bg-yellow-400 text-yellow-950 hover:bg-yellow-300",
};

// mobile-first: alvo de toque de 40/36px no celular; densidade clássica volta no desktop (lg+)
const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 gap-1 px-3 text-xs lg:h-7 lg:px-2.5",
  md: "h-10 gap-1.5 px-4 text-[13px] lg:h-8 lg:px-3",
};

export function buttonCls(variant: ButtonVariant = "secondary", size: ButtonSize = "md", className?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "secondary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonCls(variant, size, className)} {...props} />;
}

interface LinkButtonProps extends React.ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function LinkButton({ variant = "secondary", size = "md", className, ...props }: LinkButtonProps) {
  return <Link className={buttonCls(variant, size, className)} {...props} />;
}
