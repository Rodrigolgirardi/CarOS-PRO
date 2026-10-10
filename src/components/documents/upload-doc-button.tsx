"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Plus, Upload } from "lucide-react";
import { uploadDocument } from "@/lib/actions/documents";
import { DOC_TYPE } from "@/lib/labels";
import type { DocumentType } from "@/lib/types";
import type { CustomerOption } from "@/lib/queries/customers";
import type { VehicleOption } from "@/lib/queries/vehicles";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, controlCls } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

interface UploadDocButtonProps {
  vehicles?: VehicleOption[];
  customers?: CustomerOption[];
  vehicleId?: number;
  customerId?: number;
  dealId?: number;
  defaultType?: DocumentType;
  label?: string;
  /** botão único no estilo dos Atalhos rápidos ("+ Enviar documento"), sem o "Tirar foto" ao lado */
  shortcut?: boolean;
}

export function UploadDocButton({
  vehicles,
  customers,
  vehicleId,
  customerId,
  dealId,
  defaultType = "outro",
  label = "Enviar documento",
  shortcut,
}: UploadDocButtonProps) {
  const [open, setOpen] = useState(false);
  // foto tirada na hora (câmera do celular) que pré-preenche o campo de arquivo
  const [camFile, setCamFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const close = () => {
    setOpen(false);
    setCamFile(null);
    if (camRef.current) camRef.current.value = "";
  };
  const { state, formAction } = useAction(uploadDocument, { onSuccess: close });

  useEffect(() => {
    if (open && camFile && fileRef.current) {
      const dt = new DataTransfer();
      dt.items.add(camFile);
      fileRef.current.files = dt.files;
    }
  }, [open, camFile]);

  return (
    <>
      {shortcut ? (
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <Plus size={14} />
          {label}
        </Button>
      ) : (
        <>
          <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
            <Upload size={13} />
            {label}
          </Button>
          <Button size="sm" onClick={() => camRef.current?.click()}>
            <Camera size={13} />
            Tirar foto
          </Button>
        </>
      )}
      {/* abre a câmera no celular; no computador vira um seletor de arquivo comum */}
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setCamFile(f);
            setOpen(true);
          }
        }}
      />
      <Modal
        open={open}
        onClose={close}
        title={camFile ? "Salvar foto" : "Enviar documento"}
        description="O arquivo fica salvo junto com os dados do CarOS."
      >
        <form action={formAction} className="space-y-4">
          <Field label="Arquivo" required>
            <input
              ref={fileRef}
              type="file"
              name="file"
              required
              className={`${controlCls} h-auto cursor-pointer py-1.5 file:mr-3 file:h-6 file:cursor-pointer file:rounded file:border-0 file:bg-zinc-100 file:px-2 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-200`}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo" required>
              <Select name="type" defaultValue={defaultType} required>
                {(Object.keys(DOC_TYPE) as DocumentType[]).map((t) => (
                  <option key={t} value={t}>
                    {DOC_TYPE[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nome" hint="Em branco usa o nome do arquivo.">
              <Input name="name" placeholder="CRLV 2026" />
            </Field>
          </div>
          {vehicleId != null ? (
            <input type="hidden" name="vehicle_id" value={vehicleId} />
          ) : vehicles && vehicles.length > 0 ? (
            <Field label="Veículo">
              <Select name="vehicle_id" defaultValue="">
                <option value="">—</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                    {v.plate ? ` · ${v.plate}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          {customerId != null ? (
            <input type="hidden" name="customer_id" value={customerId} />
          ) : customers && customers.length > 0 ? (
            <Field label="Cliente">
              <Select name="customer_id" defaultValue="">
                <option value="">—</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          {dealId != null && <input type="hidden" name="deal_id" value={dealId} />}
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={close}>Cancelar</Button>
            <SubmitButton>{camFile ? "Salvar foto" : "Enviar"}</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
