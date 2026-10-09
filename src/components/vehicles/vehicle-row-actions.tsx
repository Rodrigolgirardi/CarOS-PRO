"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { deleteVehicle } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

interface VehicleDeleteProps {
  id: number;
  label: string;
  /** para onde ir após excluir (ex.: ficha → lista) */
  redirectAfterDelete?: string;
}

type VehicleRowActionsProps = VehicleDeleteProps;

/** Modal de confirmação + exclusão compartilhados entre o menu ⋯ e o botão da página de edição. */
function useDeleteVehicle({ id, label, redirectAfterDelete }: VehicleDeleteProps) {
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

  const confirmModal = (
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
  );

  return { openConfirm: () => setConfirmOpen(true), confirmModal };
}

export function VehicleRowActions({ id, label, redirectAfterDelete }: VehicleRowActionsProps) {
  const router = useRouter();
  const { openConfirm, confirmModal } = useDeleteVehicle({ id, label, redirectAfterDelete });

  return (
    <>
      <Menu
        ariaLabel={`Ações de ${label}`}
        items={[
          { label: "Editar", icon: <Pencil size={14} />, onSelect: () => router.push(`/veiculos/${id}/editar`) },
          { label: "Excluir", icon: <Trash2 size={14} />, danger: true, onSelect: openConfirm },
        ]}
      />
      {confirmModal}
    </>
  );
}

/** Botão direto de exclusão (zona de perigo da edição) — mesmo modal de confirmação do menu. */
export function DeleteVehicleButton({ id, label, redirectAfterDelete }: VehicleDeleteProps) {
  const { openConfirm, confirmModal } = useDeleteVehicle({ id, label, redirectAfterDelete });

  return (
    <>
      <Button variant="danger" onClick={openConfirm}>
        <Trash2 size={14} />
        Excluir veículo
      </Button>
      {confirmModal}
    </>
  );
}
