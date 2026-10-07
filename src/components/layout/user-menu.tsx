"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { logout } from "@/lib/actions/settings";
import { cn } from "@/lib/cn";

interface UserMenuProps {
  name: string;
  avatarUrl: string | null;
  login: string | null;
  authEnabled: boolean;
}

function Avatar({ name, avatarUrl, size }: { name: string; avatarUrl: string | null; size: "sm" | "md" }) {
  const cls = size === "sm" ? "size-7 text-[11px]" : "size-9 text-xs";
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt="" className={cn(cls, "shrink-0 rounded-full border border-zinc-200 object-cover")} />;
  }
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={cn(cls, "grid shrink-0 place-items-center rounded-full bg-zinc-900 font-semibold text-white")}>
      {initials || "C"}
    </span>
  );
}

/** Perfil no canto superior direito: avatar + menu com Configurações e Sair. */
export function UserMenu({ name, avatarUrl, login, authEnabled }: UserMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-transparent py-0.5 pl-0.5 pr-2 transition-colors hover:border-zinc-200 hover:bg-white"
      >
        <Avatar name={name} avatarUrl={avatarUrl} size="sm" />
        <span className="hidden max-w-[140px] truncate text-[13px] font-medium text-zinc-700 sm:inline">{name}</span>
        <ChevronDown size={13} className={cn("text-zinc-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-1.5 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg shadow-zinc-900/5">
            <div className="flex items-center gap-2.5 border-b border-zinc-100 px-3.5 py-3">
              <Avatar name={name} avatarUrl={avatarUrl} size="md" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-zinc-900">{name}</p>
                <p className="truncate text-[11px] text-zinc-400">
                  {authEnabled && login ? `@${login}` : "Sem senha de acesso"}
                </p>
              </div>
            </div>
            <div className="p-1.5">
              <Link
                href="/configuracoes"
                onClick={() => setOpen(false)}
                className="flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <Settings size={14} className="text-zinc-400" />
                Configurações
              </Link>
              {authEnabled && (
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut size={14} />
                    Sair
                  </button>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
