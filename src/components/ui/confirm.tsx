"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "./button";
import { Modal } from "./modal";
import { useToast } from "./toast";

interface ConfirmButtonProps {
  /** server action chamada ao confirmar */
  action: () => Promise<{ ok: boolean; error?: string; message?: string }>;
  title: string;
  description?: string;
  confirmLabel?: string;
  redirectTo?: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/** Botão que pede confirmação antes de executar uma ação destrutiva. */
export function ConfirmButton({
  action,
  title,
  description,
  confirmLabel = "Excluir",
  redirectTo,
  children,
  variant = "ghost",
  size = "sm",
  className,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const confirm = () => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setOpen(false);
        if (result.message) toast(result.message);
        if (redirectTo) router.push(redirectTo);
      } else {
        toast(result.error ?? "Não foi possível concluir.", "error");
      }
    });
  };

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} description={description}>
        <div className="flex justify-end gap-2">
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="danger" onClick={confirm} disabled={pending}>
            {pending && <Loader2 size={13} className="animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </Modal>
    </>
  );
}
