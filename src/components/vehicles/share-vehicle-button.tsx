"use client";

import { useState } from "react";
import { Megaphone, Receipt, Share2 } from "lucide-react";
import { Button, type ButtonSize } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
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
  /** Relatório de custos pronto (texto) — habilita "Custos para sócios" */
  costReport?: string;
  /** Carro vendido: sem anúncio, o botão compartilha direto os custos */
  costsOnly?: boolean;
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
  const [choose, setChoose] = useState(false);

  /** Relatório de custos: Web Share no celular, WhatsApp Web no computador. */
  async function shareCosts() {
    setChoose(false);
    const text = props.costReport ?? "";
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      await navigator.share({ text });
    } catch (err) {
      if (!isAbort(err)) toast("Não foi possível compartilhar.", "error");
    }
  }

  function onClick() {
    if (props.costsOnly && props.costReport) return void shareCosts();
    if (props.costReport) return setChoose(true);
    void share();
  }

  async function share() {
    setChoose(false);
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

  const choice = (icon: React.ReactNode, title: string, sub: string, onPick: () => void) => (
    <button
      type="button"
      onClick={onPick}
      className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left transition-colors hover:bg-zinc-50"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-700">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-zinc-900">{title}</span>
        <span className="block text-xs text-zinc-500">{sub}</span>
      </span>
    </button>
  );

  return (
    <>
      <Button
        variant="success"
        size={props.size}
        className={props.className}
        onClick={onClick}
        disabled={busy}
        title={props.costsOnly ? "Compartilhar custos" : "Compartilhar"}
        aria-label={props.costsOnly ? "Compartilhar custos" : "Compartilhar"}
      >
        <Share2 className="h-4 w-4" aria-hidden />
        {!props.compact && (props.costsOnly ? "Compartilhar custos" : "Compartilhar")}
      </Button>
      <Modal open={choose} onClose={() => setChoose(false)} title="O que você quer compartilhar?">
        <div className="space-y-2">
          {choice(<Megaphone size={17} />, "Anúncio para cliente", "Foto, ano, km e preço de venda.", () => void share())}
          {choice(
            <Receipt size={17} />,
            "Custos para sócios e investidores",
            "Compra, cada custo com data e valor, custo total e lucro.",
            () => void shareCosts()
          )}
        </div>
      </Modal>
    </>
  );
}
