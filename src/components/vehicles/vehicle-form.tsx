"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { lookupPlate, savePlateApiToken } from "@/lib/actions/plate";
import type { PlateData } from "@/lib/plate-lookup";
import { createPurchase, updateVehicle } from "@/lib/actions/vehicles";
import { BRANDS } from "@/lib/brands";
import { brl, pct, todayISO } from "@/lib/format";
import { FUEL_OPTIONS, PAYMENT_METHODS, TRANSMISSION_OPTIONS, VEHICLE_LAUDO, VEHICLE_LEILAO } from "@/lib/labels";
import type { VehicleRow } from "@/lib/types";
import { Button, LinkButton } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { BrandLogo } from "./brand-logo";
import { VehiclePhoto } from "./vehicle-photo";

interface VehicleFormProps {
  vehicle?: VehicleRow; // presente = edição
  defaultConsigned?: boolean; // pré-seleciona "Consignado" no cadastro novo
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3 border-b border-zinc-100 pb-2">
      <h2 className="text-[13px] font-semibold text-zinc-900">{children}</h2>
      {hint && <p className="mt-0.5 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

export function VehicleForm({ vehicle, defaultConsigned }: VehicleFormProps) {
  const editing = !!vehicle;
  const action = editing ? updateVehicle.bind(null, vehicle.id) : createPurchase;
  const { state, formAction, pending } = useAction(action);

  // estoque próprio (compra) ou consignado (carro de terceiro, sem saída de caixa)
  const [entryType, setEntryType] = useState<"proprio" | "consignado">(
    vehicle ? (vehicle.consignado ? "consignado" : "proprio") : defaultConsigned ? "consignado" : "proprio"
  );
  const consigned = entryType === "consignado";

  // simulador ao vivo (no consignado, a base de custo é o repasse ao dono)
  const [purchase, setPurchase] = useState<number | null>(
    vehicle?.consignado ? (vehicle.consignor_value ?? null) : (vehicle?.purchase_price ?? null)
  );
  const [estCosts, setEstCosts] = useState<number | null>(null);
  const [sale, setSale] = useState<number | null>(vehicle?.sale_price ?? null);
  const [saleDefault, setSaleDefault] = useState<number | null>(vehicle?.sale_price ?? null);
  const [brand, setBrand] = useState(vehicle?.brand ?? "");
  const [info, setInfo] = useState<PlateData | null>(null); // resultado extra da consulta de placa
  const [fipePrice, setFipePrice] = useState<number | null>(vehicle?.fipe_price ?? null);

  // consulta de placa (preenche marca/modelo/versão/ano/cor/combustível)
  const formRef = useRef<HTMLFormElement>(null);
  const plateRef = useRef<HTMLInputElement>(null);
  const [tokenOpen, setTokenOpen] = useState(false);
  const [looking, startLookup] = useTransition();
  const toast = useToast();

  const doLookup = () =>
    startLookup(async () => {
      const r = await lookupPlate(plateRef.current?.value ?? "");
      if (!r.ok) {
        if (r.needsToken) setTokenOpen(true);
        else toast(r.error, "error");
        return;
      }
      const d = r.data;
      const set = (name: string, value: string | number | null) => {
        if (value == null || value === "") return;
        const el = formRef.current?.elements.namedItem(name);
        if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) el.value = String(value);
      };
      if (d.brand) setBrand(d.brand);
      set("model", d.model);
      set("version", d.version);
      set("year_fab", d.year_fab);
      set("year_model", d.year_model);
      set("color", d.color);
      set("fuel", d.fuel);
      set("chassis", d.chassis);
      setInfo(d);
      if (d.fipe[0]?.valueCents != null) setFipePrice(d.fipe[0].valueCents);
      toast(`Encontrado: ${[d.brand, d.model, d.version].filter(Boolean).join(" ")}`);
    });

  const tokenForm = useAction(savePlateApiToken, {
    onSuccess: () => {
      setTokenOpen(false);
      doLookup();
    },
  });

  const realCosts = vehicle?.costs_total ?? 0;
  const totalCost = (purchase ?? 0) + realCosts + (estCosts ?? 0);
  const profit = sale != null ? sale - totalCost : null;
  const margin = sale != null && sale > 0 && profit != null ? profit / sale : null;

  return (
    <>
    <form ref={formRef} action={formAction} className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_300px]">
      {/* valor FIPE em centavos — preenchido pela consulta de placa */}
      <input type="hidden" name="fipe_price_cents" value={fipePrice ?? ""} />
      <div className="min-w-0 space-y-8">
        <section>
          <SectionTitle>Veículo</SectionTitle>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Field label="Placa" className="md:col-span-2" hint="Busque para preencher os dados do veículo.">
              <div className="flex gap-1.5">
                <Input
                  ref={plateRef}
                  name="plate"
                  defaultValue={vehicle?.plate ?? ""}
                  placeholder="ABC1D23"
                  className="flex-1 uppercase"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      doLookup();
                    }
                  }}
                />
                <Button variant="secondary" onClick={doLookup} disabled={looking} className="shrink-0">
                  {looking ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                  Buscar
                </Button>
              </div>
            </Field>
            <Field label="Chassi" className="md:col-span-2">
              <Input
                name="chassis"
                defaultValue={vehicle?.chassis ?? ""}
                placeholder="9BWZZZ377VT004251"
                maxLength={17}
                className="uppercase"
              />
            </Field>
            <Field label="Marca" required className="md:col-span-2">
              <div className="relative">
                <Input
                  name="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  list="caros-marcas"
                  placeholder="Honda"
                  required
                  className="pr-9"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                  <BrandLogo brand={brand} size={16} />
                </span>
              </div>
              <datalist id="caros-marcas">
                {BRANDS.map((b) => (
                  <option key={b.slug} value={b.name} />
                ))}
              </datalist>
            </Field>
            <Field label="Modelo" required className="md:col-span-2">
              <Input name="model" defaultValue={vehicle?.model} placeholder="Civic" required />
            </Field>
            <Field label="Versão" className="md:col-span-2">
              <Input name="version" defaultValue={vehicle?.version ?? ""} placeholder="EXL 2.0" />
            </Field>
            <Field label="Ano fabricação">
              <Input name="year_fab" defaultValue={vehicle?.year_fab ?? ""} inputMode="numeric" placeholder="2021" />
            </Field>
            <Field label="Ano modelo">
              <Input name="year_model" defaultValue={vehicle?.year_model ?? ""} inputMode="numeric" placeholder="2022" />
            </Field>
            <Field label="Quilometragem">
              <Input name="km" defaultValue={vehicle?.km ?? ""} inputMode="numeric" placeholder="45.000" />
            </Field>
            <Field label="Cor">
              <Input name="color" defaultValue={vehicle?.color ?? ""} placeholder="Prata" />
            </Field>
            <Field label="Câmbio">
              <Select name="transmission" defaultValue={vehicle?.transmission ?? ""}>
                <option value="">—</option>
                {TRANSMISSION_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label="Combustível">
              <Select name="fuel" defaultValue={vehicle?.fuel ?? ""}>
                <option value="">—</option>
                {FUEL_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label="Renavam">
              <Input name="renavam" defaultValue={vehicle?.renavam ?? ""} inputMode="numeric" />
            </Field>
            <Field label="Laudo cautelar">
              <Select name="laudo" defaultValue={vehicle?.laudo ?? ""}>
                <option value="">—</option>
                {Object.entries(VEHICLE_LAUDO).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Blindado">
              <Select name="blindado" defaultValue={vehicle?.blindado == null ? "" : String(vehicle.blindado)}>
                <option value="">—</option>
                <option value="1">Sim</option>
                <option value="0">Não</option>
              </Select>
            </Field>
            <Field label="Passagem por leilão">
              <Select name="leilao" defaultValue={vehicle?.leilao ?? ""}>
                <option value="">—</option>
                {Object.entries(VEHICLE_LEILAO).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Foto" className="md:col-span-2">
              <div className="flex items-center gap-3">
                {editing && <VehiclePhoto photo={vehicle.photo} size="sm" />}
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  className="w-full text-xs text-zinc-500 file:mr-3 file:h-7 file:cursor-pointer file:rounded-md file:border file:border-zinc-200 file:bg-white file:px-2.5 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-50"
                />
              </div>
            </Field>
            <Field label="Observações" className="col-span-2 md:col-span-4">
              <Textarea name="notes" defaultValue={vehicle?.notes ?? ""} placeholder="Único dono, revisões em dia…" />
            </Field>
          </div>

          {info && (
            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-zinc-100 bg-zinc-50/60 px-4 py-2.5 text-xs">
                <span className="font-semibold text-zinc-700">Consulta da placa</span>
                {info.restrictions.length === 0 ? (
                  <span className="flex items-center gap-1 font-medium text-emerald-600">
                    <ShieldCheck size={13} />
                    {info.situation ?? "Sem restrição"}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-medium text-red-600">
                    <ShieldAlert size={13} />
                    {info.restrictions.join(" · ")}
                  </span>
                )}
                {info.details.map((d) => (
                  <span key={d.label} className="text-zinc-500">
                    {d.label}: <strong className="font-medium text-zinc-700">{d.value}</strong>
                  </span>
                ))}
              </div>
              {info.fipe.length > 0 && (
                <>
                  <p className="px-4 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Tabela FIPE — clique numa versão para usar como preço de venda
                  </p>
                  <div className="divide-y divide-zinc-100">
                    {info.fipe.map((f, i) => (
                      <button
                        type="button"
                        key={`${f.code}-${f.model}`}
                        onClick={() => {
                          setSaleDefault(f.valueCents);
                          setSale(f.valueCents);
                          setFipePrice(f.valueCents);
                          toast(`Preço de venda preenchido com a FIPE: ${f.valueText}`);
                        }}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-[13px] transition-colors hover:bg-zinc-50"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-zinc-700">{f.model}</span>
                          {i === 0 && (
                            <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                              mais provável
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 font-medium tabular-nums text-zinc-900">{f.valueText}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        <section>
          <SectionTitle hint={editing ? undefined : "Consignado = carro de terceiro na loja, sem dinheiro saindo do caixa."}>
            Entrada
          </SectionTitle>
          <input type="hidden" name="entry_type" value={entryType} />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Field label="Tipo de entrada" className="md:col-span-2">
              <Select
                value={entryType}
                disabled={editing}
                onChange={(e) => {
                  setEntryType(e.target.value as "proprio" | "consignado");
                  setPurchase(null);
                }}
              >
                <option value="proprio">Estoque próprio (compra)</option>
                <option value="consignado">Consignado (carro de terceiro)</option>
              </Select>
            </Field>
            <div className="hidden md:col-span-2 md:block" />
            {consigned ? (
              <>
                <Field label="Dono do veículo" required className="md:col-span-2">
                  <Input
                    name="consignor"
                    defaultValue={vehicle?.consignor ?? ""}
                    placeholder="Marcos Vieira — (11) 99999-0000"
                    required
                  />
                </Field>
                <Field
                  label="Repasse combinado"
                  hint="Quanto o dono recebe quando o carro vender — vira custo só na venda."
                  className="md:col-span-2"
                >
                  <CurrencyInput
                    name="consignor_value"
                    defaultCents={vehicle?.consignor_value}
                    onCentsChange={setPurchase}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Preço de compra" required className="md:col-span-2">
                  <CurrencyInput
                    name="purchase_price"
                    defaultCents={vehicle?.purchase_price}
                    onCentsChange={setPurchase}
                    required
                  />
                </Field>
                <Field label="Data da compra" required className="md:col-span-2">
                  <Input type="date" name="purchase_date" defaultValue={vehicle?.purchase_date ?? todayISO()} required />
                </Field>
                <Field label="Vendedor" className="md:col-span-2">
                  <Input name="seller" defaultValue={vehicle?.purchase_seller ?? ""} placeholder="Particular — Marcos Vieira" />
                </Field>
                <Field label="Forma de pagamento" className="md:col-span-2">
                  <Select name="payment_method" defaultValue={vehicle?.purchase_payment ?? ""}>
                    <option value="">—</option>
                    {PAYMENT_METHODS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Observações da compra" className="col-span-2 md:col-span-4">
                  <Textarea name="purchase_notes" defaultValue={vehicle?.purchase_notes ?? ""} />
                </Field>
              </>
            )}
          </div>
        </section>

        <section>
          <SectionTitle hint="Pode deixar em branco e definir depois, na ficha do veículo.">Venda</SectionTitle>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Field label="Preço de venda planejado" className="md:col-span-2">
              <CurrencyInput
                key={saleDefault ?? "sem-preco"}
                name="sale_price"
                defaultCents={saleDefault}
                onCentsChange={setSale}
              />
            </Field>
            {!editing && (
              <Field label="Custos estimados" hint="Só para a simulação ao lado — não é salvo." className="md:col-span-2">
                <CurrencyInput onCentsChange={setEstCosts} />
              </Field>
            )}
          </div>
        </section>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-5">
          <FormError state={state} />
          <LinkButton href={editing ? `/veiculos/${vehicle.id}` : "/compras"} variant="ghost">
            Cancelar
          </LinkButton>
          <SubmitButton>{editing ? "Salvar alterações" : consigned ? "Registrar consignado" : "Registrar compra"}</SubmitButton>
        </div>
      </div>

      <aside className="top-6 rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 lg:sticky">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Simulação</h3>
        <dl className="mt-4 space-y-2.5 text-[13px]">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-500">{consigned ? "Repasse ao dono" : "Preço de compra"}</dt>
            <dd className="font-medium tabular-nums text-zinc-900">{brl(purchase ?? 0)}</dd>
          </div>
          {editing ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-zinc-500">Custos lançados</dt>
              <dd className="font-medium tabular-nums text-zinc-900">{brl(realCosts)}</dd>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-zinc-500">Custos estimados</dt>
              <dd className="font-medium tabular-nums text-zinc-900">{brl(estCosts ?? 0)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-2.5">
            <dt className="font-medium text-zinc-700">Custo total</dt>
            <dd className="font-semibold tabular-nums text-zinc-900">{brl(totalCost)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-500">Preço de venda</dt>
            <dd className="font-medium tabular-nums text-zinc-900">{sale != null ? brl(sale) : "—"}</dd>
          </div>
        </dl>
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-3.5">
          <p className="text-xs font-medium text-zinc-500">Lucro estimado</p>
          <p
            className={`mt-1 text-xl font-semibold tabular-nums tracking-tight ${
              profit == null ? "text-zinc-300" : profit >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {profit == null ? "—" : brl(profit)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">{margin != null ? `Margem de ${pct(margin)}` : "Defina o preço de venda"}</p>
        </div>
        {pending && <p className="mt-3 text-center text-xs text-zinc-400">Salvando…</p>}
      </aside>
    </form>

    <Modal
      open={tokenOpen}
      onClose={() => setTokenOpen(false)}
      title="Ativar busca por placa"
      description="A consulta usa um serviço externo pago (API Placas). A placa digitada é enviada ao provedor."
    >
      <form action={tokenForm.formAction} className="space-y-4">
        <Field label="Token do provedor" required hint="Fica salvo apenas no banco local deste computador.">
          <Input name="token" required autoFocus autoComplete="off" placeholder="Cole aqui o seu token" />
        </Field>
        <FormError state={tokenForm.state} />
        <div className="flex items-center justify-between gap-2">
          <a
            href="https://apiplacas.com.br"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-900"
          >
            Obter um token →
          </a>
          <div className="flex gap-2">
            <Button onClick={() => setTokenOpen(false)}>Cancelar</Button>
            <SubmitButton>Salvar e buscar</SubmitButton>
          </div>
        </div>
      </form>
    </Modal>
    </>
  );
}
