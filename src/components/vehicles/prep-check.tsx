"use client";

import { useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toggleTask } from "@/lib/actions/tasks";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast";

/** Checkbox grande do checklist de preparação — caixa de 24px com área de toque de 44px. */
export function PrepCheck({ id, done, label }: { id: number; done: boolean; label: string }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Reabrir ${label}` : `Concluir ${label}`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await toggleTask(id);
          if (!r.ok) toast(r.error ?? "Não foi possível atualizar.", "error");
        })
      }
      className="grid size-11 shrink-0 place-items-center"
    >
      <span
        className={cn(
          "grid size-6 place-items-center rounded-md border transition-colors",
          done ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white hover:border-zinc-500",
          pending && "opacity-50"
        )}
      >
        {pending ? (
          <Loader2 size={14} className={cn("animate-spin", !done && "text-zinc-400")} />
        ) : done ? (
          <Check size={15} strokeWidth={3} />
        ) : null}
      </span>
    </button>
  );
}
