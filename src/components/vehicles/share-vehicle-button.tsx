"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button, type ButtonSize } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { brl } from "@/lib/format";

interface ShareVehicleButtonProps {
  /** Nome do veículo, ex.: "Fiat Argo Drive 1.0" */
  label: string;
  /** Ano, ex.: "2022/2023" */
  yearLabel?: string | null;
  km?: number | null;
  color?: string | null;
  transmission?: string | null;
  fuel?: string | null;
  /** Preço de venda em centavos */
  salePrice?: number | null;
  /** URL da foto principal (ex.: /api/uploads/<file_name>) */
  photoUrl?: string | null;
  size?: ButtonSize;
  /** Compacto: só o ícone (útil em listas) */
  compact?: boolean;
  className?: string;
}

function buildAdText(p: ShareVehicleButtonProps): string {
  const lines: string[] = [`🚗 ${p.label}`];

  const specs = [
    p.yearLabel || null,
    p.km != null ? `${p.km.toLocaleString("pt-BR")} km` : null,
    p.transmission || null,
    p.fuel || null,
  ].filter(Boolean);
  if (specs.length) lines.push(`📅 ${specs.join(" · ")}`);

  if (p.color) lines.push(`🎨 ${p.color}`);
  if (p.salePrice != null) lines.push(`💰 ${brl(p.salePrice)}`);

  lines.push("", "Tenho interesse? Chama no WhatsApp!");
  return lines.join("\n");
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export function ShareVehicleButton(props: ShareVehicleButtonProps) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function share() {
    const text = buildAdText(props);

    // Sem Web Share API (desktop): abre o WhatsApp Web com o texto pronto
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
      return;
    }

    setBusy(true);
    try {
      // Tenta incluir a foto quando o aparelho suporta compartilhar arquivos
      if (props.photoUrl && typeof navigator.canShare === "function") {
        try {
          const res = await fetch(props.photoUrl);
          if (res.ok) {
            const blob = await res.blob();
            const file = new File([blob], "foto.jpg", { type: blob.type || "image/jpeg" });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ text, files: [file] });
              return;
            }
          }
        } catch (err) {
          if (isAbort(err)) return; // usuário cancelou o compartilhamento com foto
          // falhou baixar/compartilhar a foto → segue só com o texto
        }
      }
      await navigator.share({ text });
    } catch (err) {
      if (!isAbort(err)) toast("Não foi possível compartilhar.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="success"
      size={props.size}
      className={props.className}
      onClick={share}
      disabled={busy}
      title="Compartilhar anúncio"
      aria-label="Compartilhar anúncio"
    >
      <Share2 className="h-4 w-4" aria-hidden />
      {!props.compact && "Compartilhar"}
    </Button>
  );
}
