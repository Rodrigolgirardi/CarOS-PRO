"use client";

import { Lock, ShieldCheck, ShieldOff } from "lucide-react";
import { disableAuth, saveCredentials } from "@/lib/actions/settings";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";

interface AccessFormProps {
  login: string | null;
  authEnabled: boolean;
}

/** Login e senha que protegem o CarOS neste computador. */
export function AccessForm({ login, authEnabled }: AccessFormProps) {
  const save = useAction(saveCredentials);
  const disable = useAction(disableAuth);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3">
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-900">
          <Lock size={13} className="text-zinc-400" />
          Login e senha
        </h3>
        {authEnabled ? (
          <Badge tone="emerald" dot>
            Proteção ativa
          </Badge>
        ) : (
          <Badge tone="zinc" dot>
            Sem senha
          </Badge>
        )}
      </header>

      <form action={save.formAction} className="space-y-4 px-5 py-4">
        <p className="text-xs text-zinc-500">
          {authEnabled
            ? "O CarOS pede usuário e senha para abrir. Para trocar, preencha abaixo e confirme com a senha atual."
            : "Sem senha, qualquer pessoa neste computador abre o CarOS. Crie um usuário e senha para proteger seus dados."}
        </p>
        <Field label="Usuário" required>
          <Input name="login" defaultValue={login ?? ""} autoComplete="username" required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={authEnabled ? "Nova senha" : "Senha"} required>
            <Input type="password" name="password" autoComplete="new-password" required />
          </Field>
          <Field label="Confirmar senha" required>
            <Input type="password" name="confirm" autoComplete="new-password" required />
          </Field>
        </div>
        {authEnabled && (
          <Field label="Senha atual" required>
            <Input type="password" name="current_password" autoComplete="current-password" required />
          </Field>
        )}
        <FormError state={save.state} />
        <div className="flex justify-end">
          <SubmitButton>
            <ShieldCheck size={14} />
            {authEnabled ? "Salvar novo login" : "Ativar login e senha"}
          </SubmitButton>
        </div>
      </form>

      {authEnabled && (
        <form action={disable.formAction} className="space-y-3 border-t border-zinc-100 px-5 py-4">
          <p className="text-xs text-zinc-500">
            Para <span className="font-medium text-red-600">desativar a proteção</span> e abrir o CarOS sem senha,
            confirme a senha atual:
          </p>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Senha atual" required>
                <Input type="password" name="current_password" autoComplete="current-password" required />
              </Field>
            </div>
            <SubmitButton variant="danger">
              <ShieldOff size={14} />
              Desativar
            </SubmitButton>
          </div>
          <FormError state={disable.state} />
        </form>
      )}
    </section>
  );
}
