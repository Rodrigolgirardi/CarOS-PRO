"use server";

import { revalidatePath } from "next/cache";
import { all, get, run } from "../db";
import { todayISO } from "../format";
import { CUSTOMER_STATUS } from "../labels";
import { deleteUpload } from "../uploads";
import type { ActionState, Customer } from "../types";
import { err, fields, logEvent, ok } from "./util";

const revalidate = () => revalidatePath("/", "layout");

export async function saveCustomer(id: number | null, prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const name = f.s("name");
  if (!name) return err("Informe o nome do cliente.");

  const kind = f.s("kind") === "consignante" ? "consignante" : "comprador";

  if (id == null) {
    await run(
      "INSERT INTO customers (name, cpf_cnpj, phone, email, city, notes, kind, source) VALUES (?,?,?,?,?,?,?,?)",
      name,
      f.s("cpf_cnpj"),
      f.s("phone"),
      f.s("email"),
      f.s("city"),
      f.s("notes"),
      kind,
      f.s("source")
    );
    revalidate();
    return ok("Cliente cadastrado.");
  }

  const current = await get<Customer>("SELECT * FROM customers WHERE id = ?", id);
  if (!current) return err("Cliente não encontrado.");
  await run(
    "UPDATE customers SET name=?, cpf_cnpj=?, phone=?, email=?, city=?, notes=?, kind=?, source=? WHERE id=?",
    name,
    f.s("cpf_cnpj"),
    f.s("phone"),
    f.s("email"),
    f.s("city"),
    f.s("notes"),
    kind,
    f.s("source"),
    id
  );
  revalidate();
  return ok("Cliente atualizado.");
}

export async function deleteCustomer(id: number): Promise<{ ok: boolean; error?: string }> {
  const customer = await get<Customer>("SELECT * FROM customers WHERE id = ?", id);
  if (!customer) return err("Cliente não encontrado.");
  const sold = (await get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM deals WHERE customer_id = ? AND stage IN ('vendido', 'entregue')",
    id
  ))!;
  if (sold.n > 0) return err("Este cliente tem vendas registradas e não pode ser excluído.");
  const docs = await all<{ file_name: string }>("SELECT file_name FROM documents WHERE customer_id = ?", id);
  await run("DELETE FROM customers WHERE id = ?", id);
  for (const d of docs) deleteUpload(d.file_name);
  revalidate();
  return ok("Cliente excluído.");
}

export async function setCustomerStatus(id: number, status: string): Promise<{ ok: boolean; error?: string }> {
  if (!(status in CUSTOMER_STATUS)) return err("Status inválido.");
  const customer = await get<Customer>("SELECT * FROM customers WHERE id = ?", id);
  if (!customer) return err("Cliente não encontrado.");
  await run("UPDATE customers SET status = ? WHERE id = ?", status, id);
  revalidate();
  return ok();
}

export async function addContact(customerId: number, prev: ActionState, formData: FormData): Promise<ActionState> {
  const customer = await get<Customer>("SELECT * FROM customers WHERE id = ?", customerId);
  if (!customer) return err("Cliente não encontrado.");
  const f = fields(formData);
  const note = f.s("note");
  if (!note) return err("Descreva o contato.");
  await logEvent({ type: "contato", description: note, customer: customerId, date: f.s("date") ?? todayISO() });
  if (customer.status === "novo") run("UPDATE customers SET status = 'contato' WHERE id = ?", customerId);
  revalidate();
  return ok("Contato registrado.");
}
