"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { removeAvatar, saveProfile } from "@/lib/actions/settings";
import { buttonCls } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm";
import { Field, Input } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";

interface ProfileFormProps {
  name: string;
  avatarUrl: string | null;
}

/** Nome e foto (avatar) — aparecem na barra lateral e na tela de entrada. */
export function ProfileForm({ name, avatarUrl }: ProfileFormProps) {
  const { state, formAction } = useAction(saveProfile);
  const [preview, setPreview] = useState<string | null>(null);
  const shown = preview ?? avatarUrl;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <header className="border-b border-zinc-100 px-5 py-3">
        <h3 className="text-[13px] font-semibold text-zinc-900">Perfil</h3>
      </header>
      <form action={formAction} className="space-y-4 px-5 py-4">
        <div className="flex items-center gap-4">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="size-16 shrink-0 rounded-full border border-zinc-200 object-cover" />
          ) : (
            <div className="grid size-16 shrink-0 place-items-center rounded-full border border-dashed border-zinc-300 bg-zinc-50 text-zinc-300">
              <ImagePlus size={20} />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <label className={buttonCls("secondary", "sm", "cursor-pointer")}>
              {shown ? "Trocar foto" : "Escolher foto"}
              <input
                type="file"
                name="avatar"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
            </label>
            {avatarUrl && !preview && (
              <ConfirmButton
                action={removeAvatar}
                title="Remover foto?"
                description="O avatar volta para o padrão."
                confirmLabel="Remover"
                variant="danger-ghost"
                size="sm"
              >
                Remover
              </ConfirmButton>
            )}
          </div>
        </div>
        <Field label="Nome" hint="Aparece na barra lateral e na tela de entrada.">
          <Input name="name" defaultValue={name} required />
        </Field>
        <FormError state={state} />
        <div className="flex justify-end">
          <SubmitButton>Salvar perfil</SubmitButton>
        </div>
      </form>
    </section>
  );
}
