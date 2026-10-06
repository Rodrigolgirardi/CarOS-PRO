"use server";

import { revalidatePath } from "next/cache";
import { get, run, tx } from "../db";
import { todayISO } from "../format";
import type { ActionState, Payable, Receivable } from "../types";
import { deleteCost } from "./costs";
import { err, fields, logEvent, ok } from "./util";

const revalidate = () => revalidatePath("/", "layout");

/**
 * Entrada avulsa de dinheiro (documentação, retorno de financiamento…):
 * entra no caixa na data informada; comissão do vendedor, se houver,
 * vira conta a pagar automaticamente.
 */
export async function addIncome(prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const description = f.s("description");
  const amount = f.cents("amount");
  const date = f.s("date") ?? todayISO();
  if (!description) return err("Descreva a entrada (ex.: Documentação — Fiat Toro).");
  if (amount == null || amount <= 0) return err("Informe o valor recebido.");

  const customerId = f.id("customer_id");
  const sellerId = f.id("seller_id");
  const commission = f.cents("commission") ?? 0;
  const seller = sellerId ? get<{ name: string }>("SELECT name FROM sellers WHERE id = ?", sellerId) : undefined;

  tx(() => {
    run(
      "INSERT INTO receivables (description, customer_id, amount, due_date, status, received_date) VALUES (?,?,?,?,'recebido',?)",
      description,
      customerId,
      amount,
      date,
      date
    );
    logEvent({ type: "recebimento", description: `Entrada recebida — ${description}`, customer: customerId, amount, date });
    if (commission > 0) {
      run(
        "INSERT INTO payables (description, category, amount, due_date) VALUES (?,?,?,?)",
        `Comissão${seller ? ` ${seller.name}` : ""} — ${description}`,
        "Comissões",
        commission,
        date
      );
    }
  });

  revalidate();
  return ok(commission > 0 ? "Entrada registrada — comissão lançada em contas a pagar." : "Entrada registrada.");
}

// --------------------------------------------------------------- contas a pagar

export async function savePayable(id: number | null, prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const description = f.s("description");
  const amount = f.cents("amount");
  const due = f.s("due_date");
  if (!description) return err("Informe a descrição.");
  if (amount == null || amount <= 0) return err("Informe o valor.");
  if (!due) return err("Informe o vencimento.");

  if (id == null) {
    run(
      "INSERT INTO payables (description, category, amount, due_date, vehicle_id) VALUES (?,?,?,?,?)",
      description,
      f.s("category"),
      amount,
      due,
      f.id("vehicle_id")
    );
    revalidate();
    return ok("Conta adicionada.");
  }
  const current = get<Payable>("SELECT * FROM payables WHERE id = ?", id);
  if (!current) return err("Conta não encontrada.");
  run(
    "UPDATE payables SET description=?, category=?, amount=?, due_date=?, vehicle_id=? WHERE id=?",
    description,
    f.s("category"),
    amount,
    due,
    f.id("vehicle_id"),
    id
  );
  revalidate();
  return ok("Conta atualizada.");
}

export async function togglePayable(id: number): Promise<{ ok: boolean; error?: string }> {
  const p = get<Payable>("SELECT * FROM payables WHERE id = ?", id);
  if (!p) return err("Conta não encontrada.");
  if (p.status === "pendente") {
    const today = todayISO();
    run("UPDATE payables SET status = 'pago', paid_date = ? WHERE id = ?", today, id);
    logEvent({
      type: "pagamento",
      description: `Conta paga — ${p.description}`,
      vehicle: p.vehicle_id,
      amount: p.amount,
      date: today,
    });
  } else {
    run("UPDATE payables SET status = 'pendente', paid_date = NULL WHERE id = ?", id);
  }
  revalidate();
  return ok();
}

export async function deletePayable(id: number): Promise<{ ok: boolean; error?: string }> {
  run("DELETE FROM payables WHERE id = ?", id);
  revalidate();
  return ok();
}

// ------------------------------------------------------------- contas a receber

export async function saveReceivable(id: number | null, prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const description = f.s("description");
  const amount = f.cents("amount");
  const due = f.s("due_date");
  if (!description) return err("Informe a descrição.");
  if (amount == null || amount <= 0) return err("Informe o valor.");
  if (!due) return err("Informe o vencimento.");

  if (id == null) {
    run(
      "INSERT INTO receivables (description, customer_id, amount, due_date) VALUES (?,?,?,?)",
      description,
      f.id("customer_id"),
      amount,
      due
    );
    revalidate();
    return ok("Conta adicionada.");
  }
  const current = get<Receivable>("SELECT * FROM receivables WHERE id = ?", id);
  if (!current) return err("Conta não encontrada.");
  run(
    "UPDATE receivables SET description=?, customer_id=?, amount=?, due_date=? WHERE id=?",
    description,
    f.id("customer_id"),
    amount,
    due,
    id
  );
  revalidate();
  return ok("Conta atualizada.");
}

export async function toggleReceivable(id: number): Promise<{ ok: boolean; error?: string }> {
  const r = get<Receivable>("SELECT * FROM receivables WHERE id = ?", id);
  if (!r) return err("Conta não encontrada.");
  if (r.status === "pendente") {
    const today = todayISO();
    const vehicle = r.deal_id
      ? get<{ vehicle_id: number }>("SELECT vehicle_id FROM deals WHERE id = ?", r.deal_id)
      : undefined;
    run("UPDATE receivables SET status = 'recebido', received_date = ? WHERE id = ?", today, id);
    logEvent({
      type: "recebimento",
      description: `Recebido — ${r.description}`,
      customer: r.customer_id,
      vehicle: vehicle?.vehicle_id ?? null,
      deal: r.deal_id,
      amount: r.amount,
      date: today,
    });
  } else {
    run("UPDATE receivables SET status = 'pendente', received_date = NULL WHERE id = ?", id);
  }
  revalidate();
  return ok();
}

export async function deleteReceivable(id: number): Promise<{ ok: boolean; error?: string }> {
  run("DELETE FROM receivables WHERE id = ?", id);
  revalidate();
  return ok();
}

// ------------------------------------------------------------------- extrato

/** Exclui uma transação do extrato apagando a linha na tabela de origem. */
export async function deleteCashEntry(
  kind: "recebimento" | "custo" | "conta",
  id: number
): Promise<{ ok: boolean; error?: string; message?: string }> {
  if (kind === "custo") {
    const result = await deleteCost(id);
    return result.ok ? ok("Transação excluída.") : result;
  }
  if (kind === "recebimento") {
    const r = get<Receivable>("SELECT * FROM receivables WHERE id = ?", id);
    if (!r) return err("Transação não encontrada.");
    run("DELETE FROM receivables WHERE id = ?", id);
    logEvent({ type: "recebimento", description: `Recebimento excluído do caixa — ${r.description}`, amount: r.amount });
    revalidate();
    return ok("Transação excluída.");
  }
  const p = get<Payable>("SELECT * FROM payables WHERE id = ?", id);
  if (!p) return err("Transação não encontrada.");
  run("DELETE FROM payables WHERE id = ?", id);
  logEvent({
    type: "pagamento",
    description: `Conta excluída do caixa — ${p.description}`,
    vehicle: p.vehicle_id,
    amount: p.amount,
  });
  revalidate();
  return ok("Transação excluída.");
}
