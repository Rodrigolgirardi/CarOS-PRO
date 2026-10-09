"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { all, get, run, tx } from "../db";
import { brl, todayISO } from "../format";
import { AD_PLATFORMS, DEFAULT_CHECKLIST, VEHICLE_LAUDO, VEHICLE_LEILAO, VEHICLE_STATUS } from "../labels";
import { deleteUpload, saveUpload } from "../uploads";
import type { ActionState, Vehicle, VehicleStatus } from "../types";
import { err, fields, logEvent, ok } from "./util";

const revalidate = () => revalidatePath("/", "layout");
const cleanPlate = (p: string | null) => (p ? p.toUpperCase().replace(/[\s-]+/g, "") : null);
const cleanChassis = (c: string | null) => (c ? c.toUpperCase().replace(/\s+/g, "") : null);
const oneOf = (v: string | null, allowed: Record<string, string>) => (v && v in allowed ? v : null);
const simNao = (v: string | null) => (v === "1" ? 1 : v === "0" ? 0 : null);

/** Consignado exige CPF/CNPJ e WhatsApp do dono (para contato e repasse). */
function consignorContactError(cpf: string | null, whatsapp: string | null): string | null {
  const doc = (cpf ?? "").replace(/\D/g, "");
  if (doc.length !== 11 && doc.length !== 14) return "Informe o CPF (ou CNPJ) do consignante.";
  const phone = (whatsapp ?? "").replace(/\D/g, "");
  if (phone.length < 10) return "Informe o WhatsApp do consignante.";
  return null;
}

/**
 * Entrada de veículo. "Estoque próprio" cria a compra (dinheiro sai do caixa);
 * "Consignado" registra carro de terceiro na loja, sem compra e sem saída de
 * caixa — o repasse ao dono só vira custo quando o carro for vendido.
 */
export async function createPurchase(prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const consigned = f.s("entry_type") === "consignado";
  if (consigned) {
    const contactErr = consignorContactError(f.s("origin_cpf"), f.s("origin_whatsapp"));
    if (contactErr) return err(contactErr);
  }
  const brand = f.s("brand");
  const model = f.s("model");
  const price = f.cents("purchase_price");
  const date = f.s("purchase_date") ?? todayISO();
  if (!brand || !model) return err("Informe marca e modelo do veículo.");
  if (!consigned && (price == null || price <= 0)) return err("Informe o preço de compra.");
  const consignor = f.s("consignor");
  if (consigned && !consignor) return err("Informe o dono do veículo consignado.");

  const photoFile = f.file("photo");
  const photo = photoFile ? (await saveUpload(photoFile)).fileName : null;
  const salePrice = f.cents("sale_price");
  const seller = f.s("seller");
  const consignorValue = f.cents("consignor_value");

  const vehicleId = await tx(async () => {
    const v = await run(
      `INSERT INTO vehicles (brand, model, version, year_fab, year_model, plate, km, color, fuel, transmission, renavam, chassis, laudo, blindado, leilao, fipe_price, consignado, consignor, consignor_value, consignado_date, origin_cpf, origin_whatsapp, origin_email, status, sale_price, photo, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'para_arrumar',?,?,?)`,
      brand,
      model,
      f.s("version"),
      f.int("year_fab"),
      f.int("year_model"),
      cleanPlate(f.s("plate")),
      f.int("km"),
      f.s("color"),
      f.s("fuel"),
      f.s("transmission"),
      f.s("renavam"),
      cleanChassis(f.s("chassis")),
      oneOf(f.s("laudo"), VEHICLE_LAUDO),
      simNao(f.s("blindado")),
      oneOf(f.s("leilao"), VEHICLE_LEILAO),
      f.int("fipe_price_cents"),
      consigned ? 1 : 0,
      consigned ? consignor : null,
      consigned ? consignorValue : null,
      consigned ? (f.s("consignado_date") ?? todayISO()) : null,
      f.s("origin_cpf"),
      f.s("origin_whatsapp"),
      f.s("origin_email"),
      salePrice,
      photo,
      f.s("notes")
    );
    const vid = v.lastId;
    if (photo) await run("INSERT INTO vehicle_photos (vehicle_id, file_name, sort) VALUES (?,?,0)", vid, photo);
    if (!consigned) {
      await run(
        "INSERT INTO purchases (vehicle_id, seller, date, price, payment_method, notes) VALUES (?,?,?,?,?,?)",
        vid,
        seller,
        date,
        price,
        f.s("payment_method"),
        f.s("purchase_notes")
      );
    }
    // checklist padrão de preparação (vira o módulo Operações)
    for (const t of DEFAULT_CHECKLIST) await run("INSERT INTO tasks (vehicle_id, type) VALUES (?, ?)", vid, t);
    if (consigned) {
      // o dono vira cliente "consignante" automaticamente (se ainda não existir)
      const [namePart, ...phonePart] = consignor!.split("—");
      const ownerName = namePart.trim() || consignor!;
      const ownerPhone = f.s("origin_whatsapp") ?? (phonePart.join("—").trim() || null);
      const existing = await get<{ id: number }>("SELECT id FROM customers WHERE lower(name) = lower(?)", ownerName);
      const ownerId =
        existing?.id ??
        (
          await run(
            "INSERT INTO customers (name, phone, cpf_cnpj, kind, notes) VALUES (?,?,?,'consignante','Criado automaticamente ao receber um carro em consignação.')",
            ownerName,
            ownerPhone,
            f.s("origin_cpf")
          )
        ).lastId;
      await logEvent({
        type: "outro",
        description: `Deixou o ${brand} ${model} em consignação${consignorValue != null ? ` (repasse ${brl(consignorValue)})` : ""}`,
        vehicle: vid,
        customer: ownerId,
        date,
      });
    } else {
      await logEvent({
        type: "compra",
        description: `Compra registrada${seller ? ` — ${seller}` : ""}`,
        vehicle: vid,
        amount: price,
        date,
      });
    }
    if (salePrice != null)
      await logEvent({ type: "preco", description: `Preço de venda definido: ${brl(salePrice)}`, vehicle: vid, amount: salePrice, date });
    return vid;
  });

  await attachContract(f.file("contract"), vehicleId);
  revalidate();
  redirect(`/veiculos/${vehicleId}`);
}

/** Anexa o contrato enviado no formulário como documento do veículo. */
async function attachContract(file: File | null, vehicleId: number) {
  if (!file) return;
  const saved = await saveUpload(file);
  await run(
    "INSERT INTO documents (name, type, vehicle_id, file_name, mime, size) VALUES (?,?,?,?,?,?)",
    file.name || "Contrato",
    "contrato",
    vehicleId,
    saved.fileName,
    saved.mime,
    saved.size
  );
  await logEvent({ type: "documento", description: `Contrato anexado — ${file.name || "Contrato"}`, vehicle: vehicleId });
}

export async function updateVehicle(id: number, prev: ActionState, formData: FormData): Promise<ActionState> {
  const current = await get<Vehicle>("SELECT * FROM vehicles WHERE id = ?", id);
  if (!current) return err("Veículo não encontrado.");

  const f = fields(formData);
  const brand = f.s("brand");
  const model = f.s("model");
  const price = f.cents("purchase_price");
  const isConsigned = current.consignado === 1;
  if (!brand || !model) return err("Informe marca e modelo do veículo.");
  if (!isConsigned && (price == null || price <= 0)) return err("Informe o preço de compra.");
  if (isConsigned) {
    const contactErr = consignorContactError(f.s("origin_cpf"), f.s("origin_whatsapp"));
    if (contactErr) return err(contactErr);
  }

  const photoFile = f.file("photo");
  let photo = current.photo;
  if (photoFile) {
    photo = (await saveUpload(photoFile)).fileName;
    // a capa anterior continua na galeria do veículo — por isso o arquivo não é apagado
    const next = await get<{ n: number }>(
      "SELECT COALESCE(MAX(sort), -1) + 1 AS n FROM vehicle_photos WHERE vehicle_id = ?",
      id
    );
    await run("INSERT INTO vehicle_photos (vehicle_id, file_name, sort) VALUES (?,?,?)", id, photo, next?.n ?? 0);
  }
  const salePrice = f.cents("sale_price");

  await tx(async () => {
    await run(
      `UPDATE vehicles SET brand=?, model=?, version=?, year_fab=?, year_model=?, plate=?, km=?, color=?, fuel=?, transmission=?, renavam=?, chassis=?, laudo=?, blindado=?, leilao=?, fipe_price=?, consignor=?, consignor_value=?, consignado_date=?, origin_cpf=?, origin_whatsapp=?, origin_email=?, sale_price=?, photo=?, notes=? WHERE id=?`,
      brand,
      model,
      f.s("version"),
      f.int("year_fab"),
      f.int("year_model"),
      cleanPlate(f.s("plate")),
      f.int("km"),
      f.s("color"),
      f.s("fuel"),
      f.s("transmission"),
      f.s("renavam"),
      cleanChassis(f.s("chassis")),
      oneOf(f.s("laudo"), VEHICLE_LAUDO),
      simNao(f.s("blindado")),
      oneOf(f.s("leilao"), VEHICLE_LEILAO),
      f.int("fipe_price_cents") ?? current.fipe_price,
      isConsigned ? (f.s("consignor") ?? current.consignor) : current.consignor,
      isConsigned ? f.cents("consignor_value") : current.consignor_value,
      isConsigned ? (f.s("consignado_date") ?? current.consignado_date) : current.consignado_date,
      f.s("origin_cpf"),
      f.s("origin_whatsapp"),
      f.s("origin_email"),
      salePrice,
      photo,
      f.s("notes"),
      id
    );
    if (!isConsigned) {
      // consignado não tem compra para criar/atualizar
      const purchase = await get<{ id: number }>("SELECT id FROM purchases WHERE vehicle_id = ? ORDER BY id LIMIT 1", id);
      const pDate = f.s("purchase_date") ?? todayISO();
      if (purchase) {
        await run(
          "UPDATE purchases SET seller=?, date=?, price=?, payment_method=?, notes=? WHERE id=?",
          f.s("seller"),
          pDate,
          price,
          f.s("payment_method"),
          f.s("purchase_notes"),
          purchase.id
        );
      } else {
        await run(
          "INSERT INTO purchases (vehicle_id, seller, date, price, payment_method, notes) VALUES (?,?,?,?,?,?)",
          id,
          f.s("seller"),
          pDate,
          price,
          f.s("payment_method"),
          f.s("purchase_notes")
        );
      }
    }
    if ((salePrice ?? null) !== (current.sale_price ?? null)) {
      await logEvent({
        type: "preco",
        description:
          current.sale_price == null
            ? `Preço de venda definido: ${brl(salePrice)}`
            : salePrice == null
              ? "Preço de venda removido"
              : `Preço alterado: ${brl(current.sale_price)} → ${brl(salePrice)}`,
        vehicle: id,
        amount: salePrice,
      });
    }
  });

  await attachContract(f.file("contract"), id);
  revalidate();
  redirect(`/veiculos/${id}`);
}

export async function deleteVehicle(id: number): Promise<{ ok: boolean; error?: string; message?: string }> {
  const v = await get<Vehicle>("SELECT * FROM vehicles WHERE id = ?", id);
  if (!v) return err("Veículo não encontrado.");
  const docs = await all<{ file_name: string }>("SELECT file_name FROM documents WHERE vehicle_id = ?", id);
  const gallery = await all<{ file_name: string }>("SELECT file_name FROM vehicle_photos WHERE vehicle_id = ?", id);
  await run("DELETE FROM vehicles WHERE id = ?", id); // cascade remove tudo relacionado
  for (const d of docs) deleteUpload(d.file_name);
  const files = new Set([v.photo, ...gallery.map((g) => g.file_name)].filter(Boolean));
  for (const f of files) deleteUpload(f);
  revalidate();
  return ok("Veículo excluído.");
}

export async function duplicateVehicle(id: number): Promise<{ ok: boolean; error?: string; id?: number }> {
  const v = await get<Vehicle>("SELECT * FROM vehicles WHERE id = ?", id);
  if (!v) return err("Veículo não encontrado.");
  const p = await get<{ seller: string | null; price: number; payment_method: string | null }>(
    "SELECT seller, price, payment_method FROM purchases WHERE vehicle_id = ? ORDER BY id LIMIT 1",
    id
  );
  const today = todayISO();
  const newId = await tx(async () => {
    const r = await run(
      `INSERT INTO vehicles (brand, model, version, year_fab, year_model, plate, km, color, fuel, transmission, status, sale_price, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,'para_arrumar',?,?)`,
      v.brand,
      v.model,
      v.version,
      v.year_fab,
      v.year_model,
      null,
      v.km,
      v.color,
      v.fuel,
      v.transmission,
      v.sale_price,
      v.notes
    );
    const vid = r.lastId;
    await run(
      "INSERT INTO purchases (vehicle_id, seller, date, price, payment_method) VALUES (?,?,?,?,?)",
      vid,
      p?.seller ?? null,
      today,
      p?.price ?? 0,
      p?.payment_method ?? null
    );
    for (const t of DEFAULT_CHECKLIST) await run("INSERT INTO tasks (vehicle_id, type) VALUES (?, ?)", vid, t);
    await logEvent({ type: "compra", description: `Veículo duplicado a partir de ${v.brand} ${v.model}`, vehicle: vid, amount: p?.price ?? null, date: today });
    return vid;
  });
  revalidate();
  return { ok: true, id: newId };
}

export async function setVehicleStatus(id: number, status: string): Promise<{ ok: boolean; error?: string }> {
  const v = await get<Vehicle>("SELECT * FROM vehicles WHERE id = ?", id);
  if (!v) return err("Veículo não encontrado.");
  if (v.status === "vendido") return err("Veículo vendido — desfaça a venda para alterar o status.");
  if (status === "vendido") return err("Para marcar como vendido, registre a venda em Vendas.");
  if (!(status in VEHICLE_STATUS)) return err("Status inválido.");
  if (status === v.status) return ok();
  await run("UPDATE vehicles SET status = ? WHERE id = ?", status, id);
  await logEvent({
    type: "status",
    description: `Status alterado: ${VEHICLE_STATUS[v.status].label} → ${VEHICLE_STATUS[status as VehicleStatus].label}`,
    vehicle: id,
  });
  revalidate();
  return ok("Status atualizado.");
}

/** Marca/desmarca uma plataforma onde o veículo está anunciado (aba Plataformas). */
export async function toggleVehiclePlatform(
  vehicleId: number,
  platform: string
): Promise<{ ok: boolean; error?: string }> {
  if (!AD_PLATFORMS.includes(platform)) return err("Plataforma inválida.");
  const vehicle = await get<Vehicle>("SELECT * FROM vehicles WHERE id = ?", vehicleId);
  if (!vehicle) return err("Veículo não encontrado.");

  const existing = await get<{ platform: string }>(
    "SELECT platform FROM vehicle_platforms WHERE vehicle_id = ? AND platform = ?",
    vehicleId,
    platform
  );
  if (existing) {
    await run("DELETE FROM vehicle_platforms WHERE vehicle_id = ? AND platform = ?", vehicleId, platform);
    await logEvent({ type: "status", description: `Anúncio removido: ${platform}`, vehicle: vehicleId });
  } else {
    await run("INSERT INTO vehicle_platforms (vehicle_id, platform) VALUES (?, ?)", vehicleId, platform);
    await logEvent({ type: "status", description: `Anunciado em: ${platform}`, vehicle: vehicleId });
  }
  revalidate();
  return ok();
}

export async function setSalePrice(id: number, prev: ActionState, formData: FormData): Promise<ActionState> {
  const v = await get<Vehicle>("SELECT * FROM vehicles WHERE id = ?", id);
  if (!v) return err("Veículo não encontrado.");
  const price = fields(formData).cents("sale_price");
  if (price == null || price <= 0) return err("Informe um preço válido.");
  if (price === v.sale_price) return ok();
  await run("UPDATE vehicles SET sale_price = ? WHERE id = ?", price, id);
  await logEvent({
    type: "preco",
    description:
      v.sale_price == null ? `Preço de venda definido: ${brl(price)}` : `Preço alterado: ${brl(v.sale_price)} → ${brl(price)}`,
    vehicle: id,
    amount: price,
  });
  revalidate();
  return ok("Preço atualizado.");
}
