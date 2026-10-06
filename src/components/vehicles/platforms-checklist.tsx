"use client";

import { useTransition } from "react";
import { Check, Megaphone } from "lucide-react";
import { toggleVehiclePlatform } from "@/lib/actions/vehicles";
import { cn } from "@/lib/cn";
import { AD_PLATFORMS } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

function PlatformRow({ vehicleId, platform, marked }: { vehicleId: number; platform: string; marked: boolean }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await toggleVehiclePlatform(vehicleId, platform);
          if (!r.ok) toast(r.error ?? "Não foi possível atualizar.", "error");
        })
      }
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50",
        pending && "opacity-60"
      )}
    >
      <span
        className={cn(
          "grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors",
          marked ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white"
        )}
      >
        {marked && <Check size={12} strokeWidth={3} />}
      </span>
      <span className={cn("flex-1 text-[13px] font-medium", marked ? "text-zinc-900" : "text-zinc-600")}>
        {platform}
      </span>
      {marked && (
        <Badge tone="blue" dot>
          Anunciado
        </Badge>
      )}
    </button>
  );
}

/** Aba Plataformas: onde este carro já foi anunciado. */
export function PlatformsChecklist({ vehicleId, marked }: { vehicleId: number; marked: string[] }) {
  return (
    <div className="max-w-xl space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {marked.length} de {AD_PLATFORMS.length} plataformas
        </p>
        <div className="h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${(marked.length / AD_PLATFORMS.length) * 100}%` }}
          />
        </div>
      </div>
      <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
        {AD_PLATFORMS.map((p) => (
          <PlatformRow key={p} vehicleId={vehicleId} platform={p} marked={marked.includes(p)} />
        ))}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Megaphone size={12} />
        Marcar e desmarcar fica registrado no histórico do veículo.
      </p>
    </div>
  );
}
