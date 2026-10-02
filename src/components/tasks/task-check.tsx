"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { toggleTask } from "@/lib/actions/tasks";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast";

/** Checkbox de tarefa — concluir com custo informado gera o custo no veículo. */
export function TaskCheck({ id, done, label }: { id: number; done: boolean; label: string }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <button
      type="button"
      aria-label={done ? `Reabrir ${label}` : `Concluir ${label}`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await toggleTask(id);
          if (!r.ok) toast(r.error ?? "Não foi possível atualizar.", "error");
        })
      }
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors",
        done ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white hover:border-zinc-500",
        pending && "opacity-50"
      )}
    >
      {done && <Check size={12} strokeWidth={3} />}
    </button>
  );
}
