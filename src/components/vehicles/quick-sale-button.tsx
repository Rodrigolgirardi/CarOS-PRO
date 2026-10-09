"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { quickCreateCustomer } from "@/lib/actions/customers";
import { quickSale } from "@/lib/actions/deals";
import { PhoneInput } from "@/components/ui/phone-input";

const NEW_CUSTOMER = "__novo__";
import { brl, todayISO } from "@/lib/format";
import { SALE_CHANNELS } from "@/lib/labels";
import type { CustomerOption } from "@/lib/queries/customers";
import type { VehicleOption } from "@/lib/queries/vehicles";
import type { Seller } from "@/lib/types";
import { ChipInner, chipCls } from "@/components/ui/action-chip";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, Input, Select } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

interface QuickSaleButtonProps {
  vehicles: VehicleOption[]; // apenas não vendidos
  sellers: Seller[];
  customers: CustomerOption[];
  /** regra "Venda de carro" da aba Comissões — usada quando o vendedor não tem comissão própria */
  defaultCommission?: number | null;
  /** na ficha do veículo: carro já definido, o modal não pergunta qual foi vendido */
  fixedVehicleId?: number;
}

/** Botão verde "Venda": registra a venda escolhendo o carro no modal. */
export function QuickSaleButton({ vehicles, sellers, customers, defaultCommission, fixedVehicleId, chip, small }: QuickSaleButtonProps & { chip?: boolean; small?: boolean }) {
  const [open, setOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState(fixedVehicleId != null ? String(fixedVehicleId) : "");
  // um vendedor só: já vem escolhido; com vários, a escolha é feita na hora
  const [sellerId, setSellerId] = useState(sellers.length === 1 ? String(sellers[0]!.id) : "");
  const [price, setPrice] = useState<number | null>(null);
  const { state, formAction } = useAction(quickSale, {
    onSuccess: () => setOpen(false),
  });

  // cliente da venda: obrigatório; o genérico "Venda balcão" não aparece mais
  const [customerList, setCustomerList] = useState(customers.filter((c) => c.name !== "Venda balcão"));
  const [customerId, setCustomerId] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newError, setNewError] = useState<string | null>(null);
  const [creating, startCreating] = useTransition();
  const createCustomer = () =>
    startCreating(async () => {
      const r = await quickCreateCustomer(newName, newPhone);
      if (!r.ok || !r.customer) {
        setNewError(r.error ?? "Não foi possível cadastrar.");
        return;
      }
      const created = r.customer;
      setCustomerList((list) => [...list, created].sort((a, b) => a.name.localeCompare(b.name)));
      setCustomerId(String(created.id));
      setNewName("");
      setNewPhone("");
      setNewError(null);
      setNewOpen(false);
    });

  const vehicle = vehicles.find((v) => String(v.id) === vehicleId);
  const seller = sellers.find((s) => String(s.id) === sellerId);
  const priceCents = price ?? vehicle?.sale_price ?? null;
  const commissionSuggested =
    seller == null
      ? undefined
      : seller.commission_fixed != null
        ? seller.commission_fixed
        : seller.commission_pct != null && priceCents != null
          ? Math.round((priceCents * seller.commission_pct) / 100)
          : (defaultCommission ?? undefined);

  return (
    <>
      {chip ? (
        <button type="button" onClick={() => setOpen(true)} disabled={vehicles.length === 0} className={chipCls("emerald", "justify-center! px-2 disabled:opacity-50")}>
          <ChipInner icon={BadgeCheck} label="Venda" color="emerald" compact />
        </button>
      ) : (
      <Button variant="success" size={small ? "sm" : "md"} onClick={() => setOpen(true)} disabled={vehicles.length === 0}>
        <BadgeCheck size={14} />
        Venda
      </Button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={fixedVehicleId != null && vehicle ? `Registrar venda — ${vehicle.label}` : "Registrar venda"}
        description="O carro sai do estoque, a comissão vira custo e o valor entra no caixa na data da venda."
      >
        <form action={formAction} className="space-y-4">
          {fixedVehicleId != null ? (
            <input type="hidden" name="vehicle_id" value={fixedVehicleId} />
          ) : (
            <Field label="Qual carro você vendeu?" required>
              <Select
                name="vehicle_id"
                required
                value={vehicleId}
                onChange={(e) => {
                  setVehicleId(e.target.value);
                  setPrice(null);
                }}
              >
                <option value="" disabled>
                  Escolha o veículo…
                </option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                    {v.plate ? ` — ${v.plate}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor da venda" required hint={vehicle?.sale_price != null ? "Preenchido com o preço anunciado." : undefined}>
              <CurrencyInput
                key={vehicleId}
                name="sale_price"
                defaultCents={vehicle?.sale_price}
                onCentsChange={setPrice}
                required
              />
            </Field>
            <Field label="Data da venda">
              <Input type="date" name="sold_date" defaultValue={todayISO()} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vendedor" hint={sellers.length === 0 ? "Cadastre vendedores na aba Vendedores." : undefined}>
              <Select name="seller_id" value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
                <option value="">—</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.commission_fixed != null
                      ? ` (${brl(s.commission_fixed)})`
                      : s.commission_pct != null
                        ? ` (${String(s.commission_pct).replace(".", ",")}%)`
                        : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Comissão"
              hint={
                seller?.commission_fixed != null
                  ? `Sugerida pelo valor fixo de ${seller.name}.`
                  : seller?.commission_pct != null
                    ? `Sugerida pela % padrão de ${seller.name}.`
                    : undefined
              }
            >
              <CurrencyInput key={`${sellerId}-${priceCents ?? 0}`} name="commission" defaultCents={commissionSuggested} />
            </Field>
          </div>
          {/* desktop: cliente e canal lado a lado */}
          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          <Field label="Cliente" required>
            <Select
              name="customer_id"
              required
              value={customerId}
              onChange={(e) => {
                if (e.target.value === NEW_CUSTOMER) {
                  setNewOpen(true); // a escolha só vale depois de cadastrar
                  return;
                }
                setCustomerId(e.target.value);
              }}
            >
              <option value="" disabled>
                Escolha o cliente…
              </option>
              <option value={NEW_CUSTOMER}>+ Novo cliente</option>
              {customerList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Canal de venda" required>
            <Select name="channel" defaultValue={""} required>
              <option value="" disabled>
                Escolha o canal…
              </option>
              {SALE_CHANNELS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          </div>
          <FormError state={state} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton className="border-transparent bg-emerald-600 text-white hover:bg-emerald-700">
              Registrar venda
            </SubmitButton>
          </div>
        </form>
      </Modal>

      {/* popup do "+ Novo cliente": cadastra e já deixa escolhido na venda */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Novo cliente">
        <div className="space-y-4">
          <Field label="Nome" required>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do comprador" autoFocus />
          </Field>
          <Field label="WhatsApp" required>
            <PhoneInput value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="(11) 99999-0000" />
          </Field>
          {newError && <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{newError}</p>}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setNewOpen(false)}>Cancelar</Button>
            <Button variant="primary" disabled={creating} onClick={createCustomer}>
              {creating && <Loader2 size={13} className="animate-spin" />}
              Cadastrar cliente
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
