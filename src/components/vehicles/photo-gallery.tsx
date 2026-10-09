"use client";

import { useRef, useState, useTransition } from "react";
import { ExternalLink, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { addVehiclePhotos, deleteVehiclePhoto, setCoverPhoto } from "@/lib/actions/photos";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm";
import { FormError, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

// mesma rota usada pelo VehiclePhoto (lib/uploads usa node:path e não entra no cliente)
const uploadUrl = (fileName: string) => `/api/uploads/${encodeURIComponent(fileName)}`;

interface GalleryPhoto {
  id: number;
  file_name: string;
}

interface PhotoGalleryProps {
  vehicleId: number;
  photos: GalleryPhoto[];
  /** vehicles.photo — qual arquivo é a capa atual */
  coverFileName: string | null;
}

/**
 * Galeria de fotos do veículo: miniaturas em grade, envio múltiplo (câmera no
 * celular), definir capa e excluir. Tocar numa foto abre as ações.
 */
export function PhotoGallery({ vehicleId, photos, coverFileName }: PhotoGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [coverPending, startCover] = useTransition();
  const toast = useToast();

  const { state, formAction, pending } = useAction(addVehiclePhotos.bind(null, vehicleId), {
    onSuccess: () => {
      if (inputRef.current) inputRef.current.value = "";
    },
  });

  // derivada das props: ao excluir, a foto some da lista e o modal fecha sozinho
  const selected = selectedId != null ? (photos.find((p) => p.id === selectedId) ?? null) : null;

  const makeCover = (photo: GalleryPhoto) => {
    startCover(async () => {
      const result = await setCoverPhoto(photo.id);
      if (result.ok) {
        if (result.message) toast(result.message);
        setSelectedId(null);
      } else {
        toast(result.error ?? "Não foi possível definir a capa.", "error");
      }
    });
  };

  return (
    <div className="space-y-3">
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => {
            const isCover = photo.file_name === coverFileName;
            return (
              <div key={photo.id} className="relative">
              <button
                type="button"
                onClick={() => setSelectedId(photo.id)}
                className="relative block aspect-square w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-zinc-900/30 active:opacity-80"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadUrl(photo.file_name)}
                  alt="Foto do veículo"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                {isCover && (
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-zinc-900/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    <Star size={9} className="fill-current" />
                    Capa
                  </span>
                )}
              </button>
              {/* só no desktop: lixeira direto na miniatura (no celular, toca na foto) */}
              <div className="absolute right-1.5 top-1.5 hidden lg:block">
                <ConfirmButton
                  action={() => deleteVehiclePhoto(photo.id)}
                  title="Excluir foto"
                  description="A foto será removida da galeria do veículo. Essa ação não pode ser desfeita."
                  variant="danger-solid"
                  className="size-8! rounded-full! p-0! shadow-md"
                >
                  <Trash2 size={15} />
                </ConfirmButton>
              </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-200 px-3 py-6 text-center text-[13px] text-zinc-500">
          Nenhuma foto ainda. Toque no botão abaixo para fotografar ou escolher da galeria.
        </p>
      )}

      <form ref={formRef} action={formAction}>
        {/* no celular abre direto a câmera; no computador vira seletor comum */}
        <input
          ref={inputRef}
          type="file"
          name="photos"
          accept="image/*"
          capture="environment"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) formRef.current?.requestSubmit();
          }}
        />
        <Button
          type="button"
          variant="primary"
          className="h-11 w-full"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
          {pending ? "Enviando fotos…" : "+ Adicionar fotos"}
        </Button>
      </form>
      <FormError state={state} />

      <Modal
        open={selected != null}
        onClose={() => setSelectedId(null)}
        title="Foto do veículo"
        description={selected?.file_name === coverFileName ? "Esta foto é a capa do veículo." : undefined}
      >
        {selected && (
          <div className="space-y-3">
            <a
              href={uploadUrl(selected.file_name)}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadUrl(selected.file_name)}
                alt="Foto do veículo"
                className="max-h-[50vh] w-full object-contain"
              />
            </a>
            <div className="grid grid-cols-1 gap-2">
              {selected.file_name !== coverFileName && (
                <Button className="h-10 w-full" disabled={coverPending} onClick={() => makeCover(selected)}>
                  {coverPending ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                  Definir como capa
                </Button>
              )}
              <a
                href={uploadUrl(selected.file_name)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
              >
                <ExternalLink size={14} />
                Abrir foto inteira
              </a>
              <ConfirmButton
                action={() => deleteVehiclePhoto(selected.id)}
                title="Excluir foto"
                description="A foto será removida da galeria do veículo. Essa ação não pode ser desfeita."
                variant="danger"
                size="md"
                className="h-10 w-full"
              >
                <Trash2 size={14} />
                Excluir foto
              </ConfirmButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
