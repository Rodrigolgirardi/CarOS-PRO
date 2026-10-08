"use client";

import { Lock, ShieldOff } from "lucide-react";
import { disableAuth, saveCredentials } from "@/lib/actions/settings";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { Field, Input } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";

interface AccessFormProps {
  login: string | null;
  authEnabled: boolean;
}

/** Login e senha que protegem o CarOS — versão enxuta da aba Segurança. */
export function AccessForm({ login, authEnabled }: AccessFormProps) {
  const save = useAction(saveCredentials);
  const disable = useAction(disableAuth);

  return (
    <section>
      <header className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3">
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-900">
          <Lock size={13} className="text-zinc-400" />
          Login e senha
        </h3>
        <Badge tone={authEnabled ? "emerald" : "zinc"} dot>
          {authEnabled ? "Proteção ativa" : "Sem senha"}
        </Badge>
      </header>

      <form action={save.formAction} className="space-y-3 px-5 py-4">
        <div className={cn("grid gap-3", authEnabled ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
          <Field label="Usuário" required>
            <Input name="login" defaultValue={login ?? ""} autoComplete="username" required />
          </Field>
          {authEnabled && (
            <Field label="Senha atual" required>
              <Input type="password" name="current_password" autoComplete="current-password" required />
            </Field>
          )}
          <Field label={authEnabled ? "Nova senha" : "Senha"} required>
            <Input type="password" name="password" autoComplete="new-password" required />
          </Field>
          <Field label="Confirmar senha" required>
            <Input type="password" name="confirm" autoComplete="new-password" required />
          </Field>
        </div>
        <FormError state={save.state} />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">
            {authEnabled ? "Vale para todos os aparelhos." : "Com senha, o CarOS pede login para abrir."}
          </p>
          <SubmitButton>{authEnabled ? "Salvar" : "Ativar proteção"}</SubmitButton>
        </div>
      </form>

      {authEnabled && (
        <form action={disable.formAction} className="space-y-2 border-t border-zinc-100 px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-400">Desativar a proteção (abrir sem senha):</p>
            <div className="flex items-center gap-2">
              <div className="w-40">
                <Input
                  type="password"
                  name="current_password"
                  placeholder="Senha atual"
                  aria-label="Senha atual"
                  autoComplete="current-password"
                  required
                />
              </div>
              <SubmitButton variant="danger">
                <ShieldOff size={13} />
                Desativar
              </SubmitButton>
            </div>
          </div>
          <FormError state={disable.state} />
        </form>
      )}
    </section>
  );
}
