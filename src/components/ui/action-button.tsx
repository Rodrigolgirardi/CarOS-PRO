"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "./button";
import { useToast } from "./toast";

interface ActionButtonProps {
  /** server action (já com os argumentos vinculados) */
  action: () => Promise<{ ok: boolean; error?: string; message?: string }>;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/** Botão que dispara uma server action reversível (sem confirmação). */
export function ActionButton({ action, children, variant = "secondary", size = "sm", className }: ActionButtonProps) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await action();
          if (!r.ok) toast(r.error ?? "Não foi possível concluir.", "error");
          else if (r.message) toast(r.message);
        })
      }
    >
      {pending && <Loader2 size={12} className="animate-spin" />}
      {children}
    </Button>
  );
}
