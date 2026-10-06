"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { login } from "@/lib/actions/settings";
import { FormError, useAction } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";

interface LoginScreenProps {
  name: string;
  avatarUrl: string | null;
}

function EntrarButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-lime-300 text-lg font-bold text-zinc-900 transition-colors hover:bg-lime-400 disabled:pointer-events-none disabled:opacity-60"
    >
      {pending && <Loader2 size={18} className="animate-spin" />}
      Entrar
    </button>
  );
}

/** Tela cheia de entrada: aparece no lugar do app quando a senha está ativa. */
export function LoginScreen({ avatarUrl }: LoginScreenProps) {
  const { state, formAction } = useAction(login);
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();

  return (
    <div className="flex h-dvh flex-col items-center justify-center overflow-y-auto bg-zinc-100 px-4 py-8">
      {/* marca acima do cartão */}
      <div className="mb-6 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl ?? "/brand/caros-mark.png"} alt="" className="size-12 rounded-xl object-cover" />
        <span className="text-4xl font-extrabold tracking-tight text-zinc-900">CarOS PRO</span>
      </div>

      <div className="w-full max-w-lg rounded-[2rem] bg-white px-8 py-10 shadow-sm sm:px-12">
        <h1 className="mb-8 text-center text-3xl font-extrabold tracking-tight text-zinc-900">Acesse sua conta</h1>

        <form action={formAction} className="space-y-5">
          <div>
            <label className="mb-2 block text-base font-medium text-zinc-800" htmlFor="login-user">
              Usuário
            </label>
            <input
              id="login-user"
              name="login"
              autoComplete="username"
              autoFocus
              required
              placeholder="Insira o nome do seu usuário"
              className="h-14 w-full rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-base font-medium text-zinc-800" htmlFor="login-pass">
              Senha
            </label>
            <div className="relative">
              <input
                id="login-pass"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                placeholder="Insira sua senha"
                className="h-14 w-full rounded-xl border border-zinc-300 px-4 pr-12 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
              />
              <button
                type="button"
                aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2.5 text-base font-medium text-zinc-800">
              <input
                type="checkbox"
                name="remember"
                value="1"
                defaultChecked
                className="size-5 cursor-pointer rounded border-zinc-300 accent-lime-500"
              />
              Manter conectado
            </label>
            <button
              type="button"
              onClick={() =>
                toast("A senha é definida em Configurações por quem já está logado — fale com o administrador da loja.")
              }
              className="text-base font-medium text-zinc-800 underline-offset-2 hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>

          <FormError state={state} />
          <EntrarButton />
        </form>
      </div>

      <p className="mt-6 text-sm text-zinc-500">
        <span className="font-semibold text-zinc-700">CarOS PRO</span> — 2026 — © Todos os direitos reservados
      </p>
    </div>
  );
}
