import { run } from "../db";
import { parseBRL, todayISO } from "../format";
import type { EventType } from "../types";

/** Leitura segura de FormData. */
export function fields(formData: FormData) {
  const s = (k: string): string | null => {
    const v = formData.get(k);
    const t = typeof v === "string" ? v.trim() : "";
    return t || null;
  };
  const int = (k: string): number | null => {
    const t = s(k);
    if (!t) return null;
    const n = Number(t.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? Math.round(n) : null;
  };
  const cents = (k: string): number | null => parseBRL(s(k));
  const id = (k: string): number | null => {
    const n = Number(s(k));
    return Number.isInteger(n) && n > 0 ? n : null;
  };
  const file = (k: string): File | null => {
    const v = formData.get(k);
    return v instanceof File && v.size > 0 ? v : null;
  };
  return { s, int, cents, id, file };
}

export function err(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

export function ok(message?: string): { ok: true; message?: string } {
  return { ok: true, message };
}

/** Registra um evento no histórico (timeline de veículo/cliente). */
export async function logEvent(e: {
  type: EventType;
  description: string;
  vehicle?: number | null;
  customer?: number | null;
  deal?: number | null;
  amount?: number | null;
  date?: string;
}): Promise<void> {
  await run(
    "INSERT INTO events (vehicle_id, customer_id, deal_id, type, description, amount, date) VALUES (?,?,?,?,?,?,?)",
    e.vehicle ?? null,
    e.customer ?? null,
    e.deal ?? null,
    e.type,
    e.description,
    e.amount ?? null,
    e.date ?? todayISO()
  );
}
