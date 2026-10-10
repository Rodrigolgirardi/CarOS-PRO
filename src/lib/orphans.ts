import { all, get, run } from "./db";

/** Observação que o sistema grava sozinho no consignante criado automaticamente. */
const AUTO_CONSIGNOR_NOTE = "Criado automaticamente ao receber um carro em consignação.";

const blank = (v: string | null | undefined) => !v || v.trim() === "";

/**
 * Apaga o cadastro de um cliente "fantasma": ficha vazia (sem CPF, e-mail,
 * cidade nem observação escrita pelo usuário) e sem nenhum vínculo — nenhuma
 * negociação, documento, lançamento financeiro ou carro consignado no nome
 * dele. Ficha com dados de verdade nunca é apagada por aqui.
 */
export async function removeOrphanCustomer(customerId: number): Promise<void> {
  const c = await get<{
    name: string;
    cpf_cnpj: string | null;
    email: string | null;
    city: string | null;
    notes: string | null;
  }>("SELECT name, cpf_cnpj, email, city, notes FROM customers WHERE id = ?", customerId);
  if (!c || c.name === "Venda balcão") return;
  const bare =
    blank(c.cpf_cnpj) && blank(c.email) && blank(c.city) && (blank(c.notes) || c.notes!.trim() === AUTO_CONSIGNOR_NOTE);
  if (!bare) return;

  const links = (await get<{ n: number }>(
    `SELECT (SELECT COUNT(*) FROM deals WHERE customer_id = ?)
          + (SELECT COUNT(*) FROM documents WHERE customer_id = ?)
          + (SELECT COUNT(*) FROM receivables WHERE customer_id = ?)
          + (SELECT COUNT(*) FROM vehicles
              WHERE consignado = 1
                AND lower(trim(split_part(COALESCE(consignor, ''), '—', 1))) = lower(trim(?))) AS n`,
    customerId,
    customerId,
    customerId,
    c.name
  ))!;
  if (links.n === 0) await run("DELETE FROM customers WHERE id = ?", customerId);
}

/** Consignantes com esse nome (o vínculo carro→dono é pelo nome escrito no veículo). */
export async function consignorIdsByName(name: string): Promise<number[]> {
  const rows = await all<{ id: number }>(
    "SELECT id FROM customers WHERE kind = 'consignante' AND lower(trim(name)) = lower(trim(?))",
    name
  );
  return rows.map((r) => r.id);
}

/**
 * Depois de apagar uma negociação, acerta o status do cliente que ficou:
 * vendido se ainda tem venda, negociação se ainda tem lead ativo, senão contato.
 * Só mexe em status que vieram das negociações.
 */
export async function refreshCustomerStatus(customerId: number): Promise<void> {
  const c = await get<{ status: string }>("SELECT status FROM customers WHERE id = ?", customerId);
  if (!c || !["interessado", "negociacao", "vendido"].includes(c.status)) return;
  const s = (await get<{ sold: number; active: number }>(
    `SELECT COUNT(*) FILTER (WHERE stage IN ('vendido', 'entregue')) AS sold,
            COUNT(*) FILTER (WHERE stage IN ('interessado', 'proposta', 'reservado')) AS active
       FROM deals WHERE customer_id = ?`,
    customerId
  ))!;
  const next = s.sold > 0 ? "vendido" : s.active > 0 ? "negociacao" : "contato";
  if (next !== c.status) await run("UPDATE customers SET status = ? WHERE id = ?", next, customerId);
}
