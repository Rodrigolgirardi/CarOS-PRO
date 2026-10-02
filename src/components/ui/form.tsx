"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ActionState } from "@/lib/types";
import { Button, type ButtonVariant } from "./button";
import { useToast } from "./toast";

type FormAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Liga uma server action a um formulário: toast no sucesso, erro inline,
 * callback para fechar modais.
 */
export function useAction(action: FormAction, opts?: { onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState(action, null);
  const toast = useToast();
  const handled = useRef<ActionState>(null);

  useEffect(() => {
    if (state && state !== handled.current) {
      handled.current = state;
      if (state.ok) {
        if (state.message) toast(state.message);
        opts?.onSuccess?.();
      }
    }
  }, [state, toast, opts]);

  return { state, formAction, pending };
}

export function FormError({ state }: { state: ActionState }) {
  if (!state || state.ok !== false) return null;
  return <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{state.error}</p>;
}

interface SubmitButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
}

export function SubmitButton({ children, variant = "primary", className }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} className={className}>
      {pending && <Loader2 size={13} className="animate-spin" />}
      {children}
    </Button>
  );
}
