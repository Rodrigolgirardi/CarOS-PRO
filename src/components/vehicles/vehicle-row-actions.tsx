"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { deleteVehicle } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

interface VehicleRowActionsProps {
  id: number;
  label: string;
  /** para onde ir após excluir (ex.: ficha → lista) */
  redirectAfterDelete?: string;
}

export function VehicleRowActions({ id, label, redirectAfterDelete }: VehicleRowActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      const r = await deleteVehicle(id);
      if (r.ok) {
        setConfirmOpen(false);
        toast(r.message ?? "Veículo excluído.");
        if (redirectAfterDelete) router.push(redirectAfterDelete);
      } else {
        toast(r.error ?? "Não foi possível excluir.", "error");
      }
    });

  return (
    <>
      <Menu
        ariaLabel={`Ações de ${label}`}
        items={[
          { label: "Editar", icon: <Pencil size={14} />, onSelect: () => router.push(`/veiculos/${id}/editar`) },
          { label: "Excluir", icon: <Trash2 size={14} />, danger: true, onSelect: () => setConfirmOpen(true) },
        ]}
      />
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Excluir ${label}?`}
        description="Custos, tarefas, documentos, negociações e histórico deste veículo também serão removidos. Essa ação não pode ser desfeita."
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="danger" onClick={remove} disabled={pending}>
            {pending && <Loader2 size={13} className="animate-spin" />}
            Excluir veículo
          </Button>
        </div>
      </Modal>
    </>
  );
}
