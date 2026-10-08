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
  const seller = sellerId ? await get<{ name: string }>("SELECT name FROM sellers WHERE id = ?", sellerId) : undefined;

  await tx(async () => {
    await run(
      "INSERT INTO receivables (description, customer_id, amount, due_date, status, received_date) VALUES (?,?,?,?,'recebido',?)",
      description,
      customerId,
      amount,
      date,
      date
    );
    await logEvent({ type: "recebimento", description: `Entrada recebida — ${description}`, customer: customerId, amount, date });
    if (commission > 0) {
      await run(
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

/**
 * Lançamento direto no caixa (gasto ou receita avulsos): entra já como
 * pago/recebido na data informada — por padrão, o dia de hoje.
 */
export async function addCashMovement(prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const type = f.s("type") === "receita" ? "receita" : "gasto";
  const description = f.s("description");
  const amount = f.cents("amount");
  const date = f.s("date") ?? todayISO();
  if (!description) return err(type === "gasto" ? "Descreva o gasto (ex.: Conta de luz)." : "Descreva a receita (ex.: Documentação).");
  if (amount == null || amount <= 0) return err("Informe o valor.");

  if (type === "receita") {
    await run(
      "INSERT INTO receivables (description, amount, due_date, status, received_date) VALUES (?,?,?,'recebido',?)",
      description,
      amount,
      date,
      date
    );
    await logEvent({ type: "recebimento", description: `Receita lançada no caixa — ${description}`, amount, date });
  } else {
    await run(
      "INSERT INTO payables (description, category, amount, due_date, vehicle_id, status, paid_date) VALUES (?,?,?,?,?,'pago',?)",
      description,
      f.s("category") ?? "Outros",
      amount,
      date,
      f.id("vehicle_id"),
      date
    );
    await logEvent({
      type: "pagamento",
      description: `Gasto lançado no caixa — ${description}`,
      vehicle: f.id("vehicle_id"),
      amount,
      date,
    });
  }

  revalidate();
  return ok(type === "receita" ? "Receita lançada no caixa." : "Gasto lançado no caixa.");
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
    await run(
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
  const current = await get<Payable>("SELECT * FROM payables WHERE id = ?", id);
  if (!current) return err("Conta não encontrada.");
  await run(
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
  const p = await get<Payable>("SELECT * FROM payables WHERE id = ?", id);
  if (!p) return err("Conta não encontrada.");
  if (p.status === "pendente") {
    const today = todayISO();
    await run("UPDATE payables SET status = 'pago', paid_date = ? WHERE id = ?", today, id);
    await logEvent({
      type: "pagamento",
      description: `Conta paga — ${p.description}`,
      vehicle: p.vehicle_id,
      amount: p.amount,
      date: today,
    });
  } else {
    await run("UPDATE payables SET status = 'pendente', paid_date = NULL WHERE id = ?", id);
  }
  revalidate();
  return ok();
}

export async function deletePayable(id: number): Promise<{ ok: boolean; error?: string }> {
  await run("DELETE FROM payables WHERE id = ?", id);
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
    await run(
      "INSERT INTO receivables (description, customer_id, amount, due_date) VALUES (?,?,?,?)",
      description,
      f.id("customer_id"),
      amount,
      due
    );
    revalidate();
    return ok("Conta adicionada.");
  }
  const current = await get<Receivable>("SELECT * FROM receivables WHERE id = ?", id);
  if (!current) return err("Conta não encontrada.");
  await run(
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
  const r = await get<Receivable>("SELECT * FROM receivables WHERE id = ?", id);
  if (!r) return err("Conta não encontrada.");
  if (r.status === "pendente") {
    const today = todayISO();
    const vehicle = r.deal_id
      ? await get<{ vehicle_id: number }>("SELECT vehicle_id FROM deals WHERE id = ?", r.deal_id)
      : undefined;
    await run("UPDATE receivables SET status = 'recebido', received_date = ? WHERE id = ?", today, id);
    await logEvent({
      type: "recebimento",
      description: `Recebido — ${r.description}`,
      customer: r.customer_id,
      vehicle: vehicle?.vehicle_id ?? null,
      deal: r.deal_id,
      amount: r.amount,
      date: today,
    });
  } else {
    await run("UPDATE receivables SET status = 'pendente', received_date = NULL WHERE id = ?", id);
  }
  revalidate();
  return ok();
}

export async function deleteReceivable(id: number): Promise<{ ok: boolean; error?: string }> {
  await run("DELETE FROM receivables WHERE id = ?", id);
  revalidate();
  return ok();
}

// ------------------------------------------------------------------- extrato

/** Vincula (ou desvincula) um gasto do extrato a um veículo. */
export async function linkCashEntry(
  kind: "custo" | "conta",
  id: number,
  prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const f = fields(formData);
  const vehicleId = f.id("vehicle_id");
  if (kind === "custo") {
    if (!vehicleId) return err("Escolha o veículo.");
    await run("UPDATE costs SET vehicle_id = ? WHERE id = ?", vehicleId, id);
  } else {
    await run("UPDATE payables SET vehicle_id = ? WHERE id = ?", vehicleId, id);
  }
  revalidate();
  return ok(vehicleId ? "Gasto vinculado ao veículo." : "Gasto desvinculado.");
}

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
    const r = await get<Receivable>("SELECT * FROM receivables WHERE id = ?", id);
    if (!r) return err("Transação não encontrada.");
    await run("DELETE FROM receivables WHERE id = ?", id);
    await logEvent({ type: "recebimento", description: `Recebimento excluído do caixa — ${r.description}`, amount: r.amount });
    revalidate();
    return ok("Transação excluída.");
  }
  const p = await get<Payable>("SELECT * FROM payables WHERE id = ?", id);
  if (!p) return err("Transação não encontrada.");
  await run("DELETE FROM payables WHERE id = ?", id);
  await logEvent({
    type: "pagamento",
    description: `Conta excluída do caixa — ${p.description}`,
    vehicle: p.vehicle_id,
    amount: p.amount,
  });
  revalidate();
  return ok("Transação excluída.");
}
