"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Undo2 } from "lucide-react";
import { markDelivered, markLost, proposeDeal, registerSale, reserveDeal, undoSale } from "@/lib/actions/deals";
import { addDaysISO, brl, fmtDate, pct, todayISO } from "@/lib/format";
import { PAYMENT_METHODS, SALE_CHANNELS } from "@/lib/labels";
import type { DealRow } from "@/lib/types";
import { DealStageBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { ConfirmButton } from "@/components/ui/confirm";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormError, SubmitButton, useAction } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

interface DealDialogProps {
  deal: DealRow;
  open: boolean;
  onClose: () => void;
}

function SummaryRow({ label, value, strong, tone }: { label: string; value: React.ReactNode; strong?: boolean; tone?: "emerald" | "red" | "amber" }) {
  const toneCls = tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-zinc-900";
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <dt className={`text-[13px] ${strong ? "font-medium text-zinc-700" : "text-zinc-500"}`}>{label}</dt>
      <dd className={`text-[13px] tabular-nums ${strong ? "font-semibold" : "font-medium"} ${toneCls}`}>{value}</dd>
    </div>
  );
}

/** Formulário de registro da venda, com resumo financeiro ao vivo. */
function SaleForm({ deal, onBack, onDone }: { deal: DealRow; onBack: () => void; onDone: () => void }) {
  const { state, formAction } = useAction(registerSale.bind(null, deal.id), { onSuccess: onDone });
  const [sale, setSale] = useState<number | null>(deal.proposed_price ?? deal.vehicle_sale_price);
  const [down, setDown] = useState<number | null>(null);
  const [trade, setTrade] = useState<number | null>(null);
  const [commission, setCommission] = useState<number | null>(null);

  const discount = deal.vehicle_sale_price != null && sale != null ? deal.vehicle_sale_price - sale : null;
  const totalCost = deal.vehicle_total_cost + (commission ?? 0);
  const profit = sale != null ? sale - totalCost : null;
  const margin = sale != null && sale > 0 && profit != null ? profit / sale : null;
  const toReceive = sale != null ? sale - (down ?? 0) - (trade ?? 0) : null;

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Valor da venda" required>
          <CurrencyInput name="sale_price" defaultCents={deal.proposed_price ?? deal.vehicle_sale_price} onCentsChange={setSale} required autoFocus />
        </Field>
        <Field label="Data da venda">
          <Input type="date" name="sold_date" defaultValue={todayISO()} />
        </Field>
        <Field label="Entrada recebida">
          <CurrencyInput name="down_payment" onCentsChange={setDown} />
        </Field>
        <Field label="Forma de pagamento">
          <Select name="payment_method" defaultValue="">
            <option value="">—</option>
            {PAYMENT_METHODS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Field>
        <Field label="Valor financiado">
          <CurrencyInput name="financed_amount" />
        </Field>
        <Field label="Comissão" hint="Vira custo do veículo.">
          <CurrencyInput name="commission" onCentsChange={setCommission} />
        </Field>
        <Field label="Troca (descrição)">
          <Input name="trade_in_desc" placeholder="Gol 1.0 2015 prata" />
        </Field>
        <Field label="Troca (valor)">
          <CurrencyInput name="trade_in_value" onCentsChange={setTrade} />
        </Field>
        <Field label="Vencimento do saldo" hint="Para o valor que falta receber.">
          <Input type="date" name="balance_due_date" defaultValue={addDaysISO(todayISO(), 7)} />
        </Field>
        <Field label="Canal de venda" required>
          <Select name="channel" defaultValue={deal.channel ?? ""} required>
            <option value="" disabled>
              Escolha o canal…
            </option>
            {SALE_CHANNELS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Observações">
        <Textarea name="notes" />
      </Field>

      <dl className="rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 py-3">
        {discount != null && discount > 0 && <SummaryRow label="Desconto sobre o anúncio" value={brl(discount)} />}
        <SummaryRow label="Custo total do veículo" value={brl(totalCost)} />
        <SummaryRow label="Lucro" value={profit == null ? "—" : brl(profit)} strong tone={profit != null && profit < 0 ? "red" : "emerald"} />
        <SummaryRow label="Margem" value={pct(margin)} />
        <SummaryRow
          label="Fica pendente de recebimento"
          value={toReceive == null ? "—" : brl(Math.max(0, toReceive))}
          tone={toReceive != null && toReceive > 0 ? "amber" : undefined}
        />
      </dl>

      <FormError state={state} />
      <div className="flex justify-between gap-2">
        <Button variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <SubmitButton>Confirmar venda</SubmitButton>
      </div>
    </form>
  );
}

function LostForm({ deal, onBack, onDone }: { deal: DealRow; onBack: () => void; onDone: () => void }) {
  const { state, formAction } = useAction(markLost.bind(null, deal.id), { onSuccess: onDone });
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Motivo (opcional)">
        <Textarea name="reason" placeholder="Achou caro, comprou em outra loja…" autoFocus />
      </Field>
      <FormError state={state} />
      <div className="flex justify-between gap-2">
        <Button variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <SubmitButton variant="danger">Marcar como perdida</SubmitButton>
      </div>
    </form>
  );
}

function ProposalForm({ deal, onDone }: { deal: DealRow; onDone: () => void }) {
  const { state, formAction } = useAction(proposeDeal.bind(null, deal.id), { onSuccess: onDone });
  return (
    <form action={formAction} className="flex items-end gap-2">
      <Field label={deal.stage === "proposta" ? "Atualizar proposta" : "Valor da proposta"} className="flex-1">
        <CurrencyInput name="proposed_price" defaultCents={deal.proposed_price} required />
      </Field>
      <SubmitButton variant="secondary">Registrar</SubmitButton>
      <FormError state={state} />
    </form>
  );
}

export function DealDialog({ deal, open, onClose }: DealDialogProps) {
  const [view, setView] = useState<"main" | "sale" | "lost">("main");
  const close = () => {
    setView("main");
    onClose();
  };
  const active = ["interessado", "proposta", "reservado"].includes(deal.stage);
  const soldStage = deal.stage === "vendido" || deal.stage === "entregue";

  return (
    <Modal
      open={open}
      onClose={close}
      title={deal.vehicle_label}
      description={`${deal.customer_name}${deal.vehicle_plate ? ` · ${deal.vehicle_plate}` : ""}`}
      wide={view === "sale"}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <DealStageBadge stage={deal.stage} />
        <span className="text-xs text-zinc-400">
          {deal.vehicle_sale_price != null && `Anunciado por ${brl(deal.vehicle_sale_price)}`}
        </span>
      </div>

      {view === "sale" && <SaleForm deal={deal} onBack={() => setView("main")} onDone={close} />}
      {view === "lost" && <LostForm deal={deal} onBack={() => setView("main")} onDone={close} />}

      {view === "main" && (
        <div className="space-y-4">
          {deal.notes && (
            <p className="rounded-lg bg-zinc-50 px-3 py-2 text-[13px] leading-relaxed text-zinc-600">{deal.notes}</p>
          )}

          {active && (
            <>
              {deal.proposed_price != null && (
                <dl className="rounded-lg border border-zinc-200 px-4 py-2">
                  <SummaryRow label="Proposta atual" value={brl(deal.proposed_price)} strong />
                  {deal.vehicle_sale_price != null && (
                    <SummaryRow label="Desconto sobre o anúncio" value={brl(Math.max(0, deal.vehicle_sale_price - deal.proposed_price))} />
                  )}
                </dl>
              )}
              {deal.stage !== "reservado" && <ProposalForm deal={deal} onDone={() => {}} />}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-4">
                <Button variant="danger" size="sm" onClick={() => setView("lost")}>
                  Marcar perdida
                </Button>
                <div className="flex gap-2">
                  {deal.stage !== "reservado" ? (
                    <ActionButton action={reserveDeal.bind(null, deal.id)} variant="secondary" size="md">
                      Reservar veículo
                    </ActionButton>
                  ) : null}
                  <Button variant="primary" onClick={() => setView("sale")}>
                    Registrar venda
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            </>
          )}

          {soldStage && (
            <>
              <dl className="rounded-lg border border-zinc-200 px-4 py-3">
                <SummaryRow label="Valor da venda" value={brl(deal.sale_price)} strong />
                <SummaryRow label="Custo total do veículo" value={brl(deal.vehicle_total_cost)} />
                <SummaryRow
                  label="Lucro"
                  value={deal.sale_price != null ? brl(deal.sale_price - deal.vehicle_total_cost) : "—"}
                  strong
                  tone={deal.sale_price != null && deal.sale_price - deal.vehicle_total_cost < 0 ? "red" : "emerald"}
                />
                <SummaryRow
                  label="Margem"
                  value={pct(deal.sale_price ? (deal.sale_price - deal.vehicle_total_cost) / deal.sale_price : null)}
                />
                <div className="my-1.5 border-t border-zinc-100" />
                <SummaryRow label="Recebido" value={brl(deal.received)} tone="emerald" />
                <SummaryRow label="Pendente" value={brl(deal.pending)} tone={deal.pending > 0 ? "amber" : undefined} />
                {deal.sold_date && <SummaryRow label="Vendido em" value={fmtDate(deal.sold_date)} />}
                {deal.channel && <SummaryRow label="Canal" value={deal.channel} />}
                {deal.delivered_date && <SummaryRow label="Entregue em" value={fmtDate(deal.delivered_date)} />}
              </dl>
              {deal.pending > 0 && (
                <p className="text-xs text-zinc-500">
                  Registre o recebimento em{" "}
                  <Link href="/financeiro?tab=receber" className="font-medium text-zinc-900 underline underline-offset-2" onClick={close}>
                    Financeiro → Contas a receber
                  </Link>
                  .
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-4">
                <ConfirmButton
                  action={undoSale.bind(null, deal.id)}
                  title="Desfazer esta venda?"
                  description="O veículo volta para o estoque, a negociação fica como Reservado, e os recebimentos, a comissão e o repasse ao dono (se for consignado) gerados pela venda são removidos."
                  confirmLabel="Desfazer venda"
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400"
                >
                  <Undo2 size={13} />
                  Desfazer venda
                </ConfirmButton>
                {deal.stage === "vendido" && (
                  <ActionButton action={markDelivered.bind(null, deal.id)} variant="primary" size="md">
                    Marcar como entregue
                  </ActionButton>
                )}
              </div>
            </>
          )}

          {deal.stage === "perdido" && (
            <p className="rounded-lg border border-dashed border-zinc-200 px-4 py-3 text-[13px] text-zinc-500">
              Negociação encerrada. Crie uma nova negociação se o cliente voltar.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
