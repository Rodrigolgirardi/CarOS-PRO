"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, MoreVertical } from "lucide-react";
import { cn } from "@/lib/cn";

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  danger?: boolean;
}

interface MenuProps {
  items: MenuItem[];
  ariaLabel?: string;
  align?: "left" | "right";
  /** pontinhos em pé (⋮) em vez de deitados (⋯) */
  vertical?: boolean;
}

const MENU_WIDTH = 176; // w-44

/**
 * Menu "⋯" discreto para ações de linha. O dropdown é renderizado num portal
 * com posição fixa, para não ser cortado por tabelas com overflow.
 */
export function Menu({ items, ariaLabel = "Mais ações", align = "right", vertical }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const place = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const estHeight = items.length * 30 + 10;
    const top = rect.bottom + estHeight > window.innerHeight - 8 ? rect.top - estHeight - 4 : rect.bottom + 4;
    const left = align === "right" ? rect.right - MENU_WIDTH : rect.left;
    setPos({ top, left: Math.max(Math.min(left, window.innerWidth - MENU_WIDTH - 8), 8) });
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!buttonRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onMove = () => setOpen(false); // rolagem/resize fecham para não "descolar"
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        onClick={() => {
          if (!open) place();
          setOpen((o) => !o);
        }}
        className={cn(
          "grid size-7 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700",
          open && "bg-zinc-100 text-zinc-700"
        )}
      >
        {vertical ? <MoreVertical size={15} /> : <MoreHorizontal size={15} />}
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: MENU_WIDTH }}
            className="z-50 animate-[pop-in_.12s_ease-out] rounded-lg border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-900/5"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
                  item.danger ? "text-red-600 hover:bg-red-50" : "text-zinc-700 hover:bg-zinc-50"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
