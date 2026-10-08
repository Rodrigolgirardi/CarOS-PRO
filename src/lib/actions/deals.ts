"use server";

import { revalidatePath } from "next/cache";
import { all, get, run, tx } from "../db";
import { addDaysISO, brl, todayISO } from "../format";
import type { ActionState, Customer, CustomerStatus, Deal, Seller, VehicleStatus } from "../types";
import { err, fields, logEvent, ok } from "./util";

const revalidate = () => revalidatePath("/", "layout");

const RANK: Record<CustomerStatus, number> = {
  novo: 0,
  perdido: 0,
  contato: 1,
  interessado: 2,
  negociacao: 3,
  vendido: 4,
};

/** Sobe o status do cliente conforme a negociação avança (nunca rebaixa). */
async function upgradeCustomer(customerId: number, to: CustomerStatus) {
  const c = await get<Customer>("SELECT * FROM customers WHERE id = ?", customerId);
  if (!c || c.status === "vendido") return;
  if (RANK[to] > RANK[c.status]) await run("UPDATE customers SET status = ? WHERE id = ?", to, customerId);
}

interface DealCtx extends Deal {
  customer_name: string;
  vehicle_label: string;
  vehicle_status: VehicleStatus;
  vehicle_sale_price: number | null;
  vehicle_consignado: number;
  vehicle_consignor: string | null;
  vehicle_consignor_value: number | null;
}

function dealCtx(id: number): Promise<DealCtx | undefined> {
  return get<DealCtx>(
    `SELECT d.*, cu.name AS customer_name,
       TRIM(v.brand || ' ' || v.model || ' ' || COALESCE(v.version, '')) AS vehicle_label,
       v.status AS vehicle_status, v.sale_price AS vehicle_sale_price,
       v.consignado AS vehicle_consignado, v.consignor AS vehicle_consignor,
       v.consignor_value AS vehicle_consignor_value
     FROM deals d
     JOIN customers cu ON cu.id = d.customer_id
     JOIN vehicles v   ON v.id = d.vehicle_id
     WHERE d.id = ?`,
    id
  );
}

export async function createDeal(prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  let customerId = f.id("customer_id");
  const vehicleId = f.id("vehicle_id");
  const stage = f.s("stage") === "proposta" ? "proposta" : "interessado";
  const proposed = f.cents("proposed_price");

  // "+ Novo cliente" direto na negociação: cadastra na hora
  if (f.s("customer_id") === "novo") {
    const newName = f.s("new_customer_name");
    if (!newName) return err("Informe o nome do novo cliente.");
    customerId = (
      await run("INSERT INTO customers (name, phone) VALUES (?,?)", newName, f.s("new_customer_phone"))
    ).lastId;
  }
  if (!customerId) return err("Escolha o cliente.");
  if (!vehicleId) return err("Escolha o veículo.");
  if (stage === "proposta" && (proposed == null || proposed <= 0)) return err("Informe o valor da proposta.");

  const vehicle = await get<{ status: string; label: string }>(
    "SELECT status, TRIM(brand || ' ' || model || ' ' || COALESCE(version, '')) AS label FROM vehicles WHERE id = ?",
    vehicleId
  );
  if (!vehicle) return err("Veículo não encontrado.");
  if (vehicle.status === "vendido") return err("Este veículo já foi vendido.");

  const existing = (await get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM deals WHERE customer_id = ? AND vehicle_id = ? AND stage IN ('interessado', 'proposta', 'reservado')",
    customerId,
    vehicleId
  ))!;
  if (existing.n > 0) return err("Já existe uma negociação ativa deste cliente para este veículo.");

  const customer = await get<Customer>("SELECT * FROM customers WHERE id = ?", customerId);
  if (!customer) return err("Cliente não encontrado.");

  await tx(async () => {
    const r = await run(
      "INSERT INTO deals (vehicle_id, customer_id, stage, proposed_price, notes) VALUES (?,?,?,?,?)",
      vehicleId,
      customerId,
      stage,
      stage === "proposta" ? proposed : null,
      f.s("notes")
    );
    if (stage === "proposta") {
      await logEvent({
        type: "proposta",
        description: `Proposta de ${customer.name}: ${brl(proposed)}`,
        vehicle: vehicleId,
        customer: customerId,
        deal: r.lastId,
        amount: proposed,
      });
      await upgradeCustomer(customerId, "negociacao");
    } else {
      await logEvent({
        type: "contato",
        description: `${customer.name} demonstrou interesse no ${vehicle.label}`,
        vehicle: vehicleId,
        customer: customerId,
        deal: r.lastId,
      });
      await upgradeCustomer(customerId, "interessado");
    }
  });
  revalidate();
  return ok("Negociação criada.");
}

export async function proposeDeal(dealId: number, prev: ActionState, formData: FormData): Promise<ActionState> {
  const deal = await dealCtx(dealId);
  if (!deal) return err("Negociação não encontrada.");
  if (!["interessado", "proposta"].includes(deal.stage)) return err("Esta negociação não está aberta a propostas.");
  const proposed = fields(formData).cents("proposed_price");
  if (proposed == null || proposed <= 0) return err("Informe o valor da proposta.");

  await tx(async () => {
    await run("UPDATE deals SET stage = 'proposta', proposed_price = ? WHERE id = ?", proposed, dealId);
    await logEvent({
      type: "proposta",
      description: `Proposta de ${deal.customer_name}: ${brl(proposed)}`,
      vehicle: deal.vehicle_id,
      customer: deal.customer_id,
      deal: dealId,
      amount: proposed,
    });
    await upgradeCustomer(deal.customer_id, "negociacao");
  });
  revalidate();
  return ok("Proposta registrada.");
}

export async function reserveDeal(dealId: number): Promise<{ ok: boolean; error?: string }> {
  const deal = await dealCtx(dealId);
  if (!deal) return err("Negociação não encontrada.");
  if (!["interessado", "proposta"].includes(deal.stage)) return err("Só é possível reservar a partir de interesse ou proposta.");
  if (deal.vehicle_status === "vendido") return err("Este veículo já foi vendido.");
  const other = (await get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM deals WHERE vehicle_id = ? AND stage = 'reservado' AND id != ?",
    deal.vehicle_id,
    dealId
  ))!;
  if (other.n > 0) return err("Já existe uma reserva ativa para este veículo.");

  await tx(async () => {
    await run("UPDATE deals SET stage = 'reservado' WHERE id = ?", dealId);
    await logEvent({
      type: "reserva",
      description: `Veículo reservado para ${deal.customer_name}`,
      vehicle: deal.vehicle_id,
      customer: deal.customer_id,
      deal: dealId,
    });
    await upgradeCustomer(deal.customer_id, "negociacao");
  });
  revalidate();
  return ok();
}

/**
 * Registra a venda: atualiza o estoque, gera comissão como custo,
 * cria os recebíveis (entrada recebida + saldo pendente) e fecha
 * negociações concorrentes do mesmo veículo.
 */
export async function registerSale(dealId: number, prev: ActionState, formData: FormData): Promise<ActionState> {
  const deal = await dealCtx(dealId);
  if (!deal) return err("Negociação não encontrada.");
  if (["vendido", "entregue"].includes(deal.stage)) return err("Esta venda já foi registrada.");
  if (deal.vehicle_status === "vendido") return err("Este veículo já foi vendido em outra negociação.");

  const f = fields(formData);
  const salePrice = f.cents("sale_price");
  if (salePrice == null || salePrice <= 0) return err("Informe o valor da venda.");
  const soldDate = f.s("sold_date") ?? todayISO();
  const down = f.cents("down_payment") ?? 0;
  const tradeValue = f.cents("trade_in_value") ?? 0;
  const tradeDesc = f.s("trade_in_desc");
  const commission = f.cents("commission") ?? 0;
  const financed = f.cents("financed_amount");
  const balance = salePrice - down - tradeValue;
  if (balance < 0) return err("Entrada + troca somam mais que o valor da venda.");
  if (down > 0 && down > salePrice) return err("A entrada não pode ser maior que o valor da venda.");
  const balanceDue = f.s("balance_due_date") ?? addDaysISO(soldDate, 7);

  await tx(async () => {
    await run(
      `UPDATE deals SET stage = 'vendido', sale_price = ?, down_payment = ?, payment_method = ?, financed_amount = ?,
         trade_in_desc = ?, trade_in_value = ?, commission = ?, channel = COALESCE(?, channel), notes = COALESCE(?, notes), sold_date = ?
       WHERE id = ?`,
      salePrice,
      down > 0 ? down : null,
      f.s("payment_method"),
      financed,
      tradeDesc,
      tradeValue > 0 ? tradeValue : null,
      commission > 0 ? commission : null,
      f.s("channel"),
      f.s("notes"),
      soldDate,
      dealId
    );
    await run("UPDATE vehicles SET status = 'vendido' WHERE id = ?", deal.vehicle_id);

    if (commission > 0) {
      const c = await run(
        "INSERT INTO costs (vehicle_id, category, description, amount, date) VALUES (?, 'comissao', ?, ?, ?)",
        deal.vehicle_id,
        `Comissão — venda para ${deal.customer_name}`,
        commission,
        soldDate
      );
      await run("UPDATE deals SET commission_cost_id = ? WHERE id = ?", c.lastId, dealId);
      await logEvent({
        type: "custo",
        description: `Custo adicionado — Comissão: venda para ${deal.customer_name}`,
        vehicle: deal.vehicle_id,
        amount: commission,
        date: soldDate,
      });
    }

    // consignado: o repasse combinado com o dono vira custo na venda
    if (deal.vehicle_consignado === 1 && deal.vehicle_consignor_value != null && deal.vehicle_consignor_value > 0) {
      await run(
        "INSERT INTO costs (vehicle_id, category, description, amount, date) VALUES (?, 'outros', ?, ?, ?)",
        deal.vehicle_id,
        `Repasse ao dono${deal.vehicle_consignor ? ` — ${deal.vehicle_consignor}` : ""} (consignação)`,
        deal.vehicle_consignor_value,
        soldDate
      );
      await logEvent({
        type: "custo",
        description: `Repasse ao dono${deal.vehicle_consignor ? ` — ${deal.vehicle_consignor}` : ""} (consignação)`,
        vehicle: deal.vehicle_id,
        amount: deal.vehicle_consignor_value,
        date: soldDate,
      });
    }

    await logEvent({
      type: "venda",
      description: `Venda registrada para ${deal.customer_name} — ${brl(salePrice)}`,
      vehicle: deal.vehicle_id,
      customer: deal.customer_id,
      deal: dealId,
      amount: salePrice,
      date: soldDate,
    });

    if (down > 0) {
      await run(
        "INSERT INTO receivables (description, customer_id, deal_id, amount, due_date, status, received_date) VALUES (?,?,?,?,?,'recebido',?)",
        `Entrada — ${deal.vehicle_label}`,
        deal.customer_id,
        dealId,
        down,
        soldDate,
        soldDate
      );
      await logEvent({
        type: "recebimento",
        description: `Entrada recebida — ${deal.vehicle_label}`,
        vehicle: deal.vehicle_id,
        customer: deal.customer_id,
        deal: dealId,
        amount: down,
        date: soldDate,
      });
    }
    if (tradeValue > 0) {
      await logEvent({
        type: "outro",
        description: `Troca aceita como parte do pagamento${tradeDesc ? `: ${tradeDesc}` : ""} (${brl(tradeValue)})`,
        vehicle: deal.vehicle_id,
        customer: deal.customer_id,
        deal: dealId,
        amount: tradeValue,
        date: soldDate,
      });
    }
    if (balance > 0) {
      await run(
        "INSERT INTO receivables (description, customer_id, deal_id, amount, due_date) VALUES (?,?,?,?,?)",
        `${financed && financed > 0 ? "Repasse financiamento" : "Saldo da venda"} — ${deal.vehicle_label}`,
        deal.customer_id,
        dealId,
        balance,
        balanceDue
      );
    }

    // negociações concorrentes do mesmo veículo são encerradas
    const competing = await all<{ id: number; customer_id: number; name: string }>(
      `SELECT d.id, d.customer_id, cu.name FROM deals d JOIN customers cu ON cu.id = d.customer_id
       WHERE d.vehicle_id = ? AND d.id != ? AND d.stage IN ('interessado', 'proposta', 'reservado')`,
      deal.vehicle_id,
      dealId
    );
    for (const c of competing) {
      await run("UPDATE deals SET stage = 'perdido' WHERE id = ?", c.id);
      await logEvent({
        type: "status",
        description: `Negociação com ${c.name} encerrada — veículo vendido`,
        vehicle: deal.vehicle_id,
        customer: c.customer_id,
        deal: c.id,
        date: soldDate,
      });
    }

    await run("UPDATE customers SET status = 'vendido' WHERE id = ?", deal.customer_id);
  });

  revalidate();
  return ok(
    tradeValue > 0
      ? "Venda registrada. Lembre de cadastrar o veículo recebido na troca em Compras."
      : "Venda registrada."
  );
}

/**
 * Venda rápida pelo botão "Vendido": escolhe o veículo, valor e (opcional)
 * vendedor/cliente. Cria a negociação já vendida, baixa o estoque, lança a
 * comissão como custo e registra o valor como recebido na data da venda.
 */
export async function quickSale(prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const vehicleId = f.id("vehicle_id");
  if (!vehicleId) return err("Escolha o veículo vendido.");
  const vehicle = await get<{ status: string; label: string; consignado: number; consignor: string | null; consignor_value: number | null }>(
    "SELECT status, TRIM(brand || ' ' || model || ' ' || COALESCE(version, '')) AS label, consignado, consignor, consignor_value FROM vehicles WHERE id = ?",
    vehicleId
  );
  if (!vehicle) return err("Veículo não encontrado.");
  if (vehicle.status === "vendido") return err("Este veículo já foi vendido.");

  const salePrice = f.cents("sale_price");
  if (salePrice == null || salePrice <= 0) return err("Informe o valor da venda.");
  const soldDate = f.s("sold_date") ?? todayISO();

  const sellerId = f.id("seller_id");
  const seller = sellerId ? await get<Seller>("SELECT * FROM sellers WHERE id = ?", sellerId) : undefined;
  if (sellerId && !seller) return err("Vendedor não encontrado.");
  let commission = f.cents("commission");
  if (commission == null && seller) {
    if (seller.commission_fixed != null) commission = seller.commission_fixed;
    else if (seller.commission_pct != null) commission = Math.round((salePrice * seller.commission_pct) / 100);
    else {
      // sem comissão própria: usa a regra padrão "Venda de carro" (aba Comissões)
      const rule = await get<{ amount: number | null }>("SELECT amount FROM commission_rules WHERE key = 'venda_carro'");
      commission = rule?.amount ?? null;
    }
  }
  commission ??= 0;

  // sem cliente escolhido, a venda entra num cliente genérico de balcão
  let customerId = f.id("customer_id");
  let customerName: string;
  if (customerId) {
    const c = await get<Customer>("SELECT * FROM customers WHERE id = ?", customerId);
    if (!c) return err("Cliente não encontrado.");
    customerName = c.name;
  } else {
    const generic = await get<Customer>("SELECT * FROM customers WHERE name = 'Venda balcão'");
    customerId =
      generic?.id ??
      (
        await run(
          "INSERT INTO customers (name, status, notes) VALUES ('Venda balcão', 'vendido', 'Cliente genérico usado pelas vendas rápidas (botão Vendido).')"
        )
      ).lastId;
    customerName = "Venda balcão";
  }

  await tx(async () => {
    const dealId = (await run(
      "INSERT INTO deals (vehicle_id, customer_id, stage, sale_price, commission, seller_id, channel, sold_date) VALUES (?,?,'vendido',?,?,?,?,?)",
      vehicleId,
      customerId!,
      salePrice,
      commission > 0 ? commission : null,
      seller?.id ?? null,
      f.s("channel"),
      soldDate
    )).lastId;
    await run("UPDATE vehicles SET status = 'vendido', sale_price = COALESCE(sale_price, ?) WHERE id = ?", salePrice, vehicleId);

    if (commission > 0) {
      const c = await run(
        "INSERT INTO costs (vehicle_id, category, description, amount, date) VALUES (?, 'comissao', ?, ?, ?)",
        vehicleId,
        `Comissão — ${seller?.name ?? "venda"}`,
        commission,
        soldDate
      );
      await run("UPDATE deals SET commission_cost_id = ? WHERE id = ?", c.lastId, dealId);
      await logEvent({
        type: "custo",
        description: `Custo adicionado — Comissão${seller ? `: ${seller.name}` : ""}`,
        vehicle: vehicleId,
        amount: commission,
        date: soldDate,
      });
    }

    // consignado: o repasse combinado com o dono vira custo na venda
    if (vehicle.consignado === 1 && vehicle.consignor_value != null && vehicle.consignor_value > 0) {
      await run(
        "INSERT INTO costs (vehicle_id, category, description, amount, date) VALUES (?, 'outros', ?, ?, ?)",
        vehicleId,
        `Repasse ao dono${vehicle.consignor ? ` — ${vehicle.consignor}` : ""} (consignação)`,
        vehicle.consignor_value,
        soldDate
      );
      await logEvent({
        type: "custo",
        description: `Repasse ao dono${vehicle.consignor ? ` — ${vehicle.consignor}` : ""} (consignação)`,
        vehicle: vehicleId,
        amount: vehicle.consignor_value,
        date: soldDate,
      });
    }

    await logEvent({
      type: "venda",
      description: `Venda registrada${seller ? ` por ${seller.name}` : ""} — ${brl(salePrice)}`,
      vehicle: vehicleId,
      customer: customerId!,
      deal: dealId,
      amount: salePrice,
      date: soldDate,
    });

    await run(
      "INSERT INTO receivables (description, customer_id, deal_id, amount, due_date, status, received_date) VALUES (?,?,?,?,?,'recebido',?)",
      `Venda — ${vehicle.label}`,
      customerId!,
      dealId,
      salePrice,
      soldDate,
      soldDate
    );
    await logEvent({
      type: "recebimento",
      description: `Venda recebida — ${vehicle.label}`,
      vehicle: vehicleId,
      customer: customerId!,
      deal: dealId,
      amount: salePrice,
      date: soldDate,
    });

    // negociações concorrentes do mesmo veículo são encerradas
    const competing = await all<{ id: number; customer_id: number; name: string }>(
      `SELECT d.id, d.customer_id, cu.name FROM deals d JOIN customers cu ON cu.id = d.customer_id
       WHERE d.vehicle_id = ? AND d.id != ? AND d.stage IN ('interessado', 'proposta', 'reservado')`,
      vehicleId,
      dealId
    );
    for (const c of competing) {
      await run("UPDATE deals SET stage = 'perdido' WHERE id = ?", c.id);
      await logEvent({
        type: "status",
        description: `Negociação com ${c.name} encerrada — veículo vendido`,
        vehicle: vehicleId,
        customer: c.customer_id,
        deal: c.id,
        date: soldDate,
      });
    }

    await run("UPDATE customers SET status = 'vendido' WHERE id = ?", customerId!);
  });

  revalidate();
  return ok(`Venda do ${vehicle.label} registrada${customerName !== "Venda balcão" ? ` para ${customerName}` : ""}.`);
}

export async function markDelivered(dealId: number): Promise<{ ok: boolean; error?: string }> {
  const deal = await dealCtx(dealId);
  if (!deal) return err("Negociação não encontrada.");
  if (deal.stage !== "vendido") return err("Só é possível entregar uma venda registrada.");
  const today = todayISO();
  await run("UPDATE deals SET stage = 'entregue', delivered_date = ? WHERE id = ?", today, dealId);
  await logEvent({
    type: "entrega",
    description: `Veículo entregue a ${deal.customer_name}`,
    vehicle: deal.vehicle_id,
    customer: deal.customer_id,
    deal: dealId,
    date: today,
  });
  revalidate();
  return ok("Entrega registrada.");
}

export async function markLost(dealId: number, prev: ActionState, formData: FormData): Promise<ActionState> {
  const deal = await dealCtx(dealId);
  if (!deal) return err("Negociação não encontrada.");
  if (!["interessado", "proposta", "reservado"].includes(deal.stage)) return err("Esta negociação não está ativa.");
  const reason = fields(formData).s("reason");

  await tx(async () => {
    await run(
      "UPDATE deals SET stage = 'perdido', notes = COALESCE(?, notes) WHERE id = ?",
      reason ? `Motivo da perda: ${reason}` : null,
      dealId
    );
    await logEvent({
      type: "status",
      description: `Negociação perdida — ${deal.customer_name}${reason ? ` (${reason})` : ""}`,
      vehicle: deal.vehicle_id,
      customer: deal.customer_id,
      deal: dealId,
    });
    const active = (await get<{ n: number }>(
      "SELECT COUNT(*) AS n FROM deals WHERE customer_id = ? AND stage IN ('interessado', 'proposta', 'reservado') AND id != ?",
      deal.customer_id,
      dealId
    ))!;
    const customer = await get<Customer>("SELECT * FROM customers WHERE id = ?", deal.customer_id);
    if (customer && customer.status !== "vendido" && active.n === 0) {
      await run("UPDATE customers SET status = 'perdido' WHERE id = ?", deal.customer_id);
    }
  });
  revalidate();
  return ok("Negociação marcada como perdida.");
}

/** Desfaz uma venda registrada por engano: volta para "reservado" e remove recebíveis/comissão gerados. */
export async function undoSale(dealId: number): Promise<{ ok: boolean; error?: string }> {
  const deal = await dealCtx(dealId);
  if (!deal) return err("Negociação não encontrada.");
  if (!["vendido", "entregue"].includes(deal.stage)) return err("Esta negociação não é uma venda.");

  await tx(async () => {
    await run("DELETE FROM receivables WHERE deal_id = ?", dealId);
    if (deal.commission_cost_id) {
      await run("DELETE FROM costs WHERE id = ?", deal.commission_cost_id);
      await run("UPDATE deals SET commission_cost_id = NULL WHERE id = ?", dealId);
    }
    await run("UPDATE deals SET stage = 'reservado', sold_date = NULL, delivered_date = NULL WHERE id = ?", dealId);
    await run("UPDATE vehicles SET status = 'cadastrado' WHERE id = ?", deal.vehicle_id);
    await logEvent({
      type: "status",
      description: `Venda desfeita — ${deal.customer_name}`,
      vehicle: deal.vehicle_id,
      customer: deal.customer_id,
      deal: dealId,
    });
    const otherSold = (await get<{ n: number }>(
      "SELECT COUNT(*) AS n FROM deals WHERE customer_id = ? AND stage IN ('vendido', 'entregue') AND id != ?",
      deal.customer_id,
      dealId
    ))!;
    if (otherSold.n === 0) run("UPDATE customers SET status = 'negociacao' WHERE id = ?", deal.customer_id);
  });
  revalidate();
  return ok("Venda desfeita.");
}
