"use client";

import { useRef } from "react";
import { Send } from "lucide-react";
import { addFeedback } from "@/lib/actions/custom-types";
import { Textarea } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";

export function FeedbackForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { state, formAction } = useAction(addFeedback, {
    onSuccess: () => formRef.current?.reset(),
  });
  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <Textarea name="message" required rows={4} placeholder="Escreva seu feedback ou sugestão…" />
      <FormError state={state} />
      <div className="flex justify-end">
        <SubmitButton>
          <Send size={14} />
          Enviar
        </SubmitButton>
      </div>
    </form>
  );
}
