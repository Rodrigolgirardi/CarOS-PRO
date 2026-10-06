"use client";

import { Lock } from "lucide-react";
import { login } from "@/lib/actions/settings";
import { Field, Input } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";

interface LoginScreenProps {
  name: string;
  avatarUrl: string | null;
}

/** Tela cheia de entrada: aparece no lugar do app quando a senha está ativa. */
export function LoginScreen({ name, avatarUrl }: LoginScreenProps) {
  const { state, formAction } = useAction(login);

  return (
    <div className="grid h-dvh place-items-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="size-20 rounded-full border border-zinc-200 object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/brand/caros-mark.png" alt="" className="size-20 rounded-xl object-cover" />
            )}
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">CarOS PRO</h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-400">
              <Lock size={13} />
              Entre para abrir o CarOS
            </p>
          </div>
          <form action={formAction} className="space-y-5">
            <Field label="Usuário" required>
              <Input name="login" autoComplete="username" autoFocus required className="h-12 px-4 text-base" />
            </Field>
            <Field label="Senha" required>
              <Input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                className="h-12 px-4 text-base"
              />
            </Field>
            <FormError state={state} />
            <SubmitButton className="h-12 w-full text-base">Entrar</SubmitButton>
          </form>
        </div>
        <p className="mt-4 text-center text-[11px] text-zinc-400">CarOS — o sistema operacional da sua revenda</p>
      </div>
    </div>
  );
}
