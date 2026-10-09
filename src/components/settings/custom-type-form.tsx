"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import { addCustomType } from "@/lib/actions/custom-types";
import { Input } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";

/** Campo + botão para criar um tipo de saída ou de entrada. */
export function CustomTypeForm({ kind }: { kind: "saida" | "entrada" }) {
  const formRef = useRef<HTMLFormElement>(null);
  const { state, formAction } = useAction(addCustomType.bind(null, kind), {
    onSuccess: () => formRef.current?.reset(),
  });
  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Input
            name="label"
            maxLength={40}
            required
            placeholder={kind === "saida" ? "Ex.: Polimento, Seguro, Vistoria…" : "Ex.: Garantia estendida, Aluguel…"}
          />
        </div>
        <SubmitButton>
          <Plus size={14} />
          {kind === "saida" ? "Criar tipo de saída" : "Criar tipo de entrada"}
        </SubmitButton>
      </div>
      <FormError state={state} />
    </form>
  );
}
