import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { get, getMeta, run, setMeta } from "./db";

export const SESSION_COOKIE = "caros_session";

/** Guarda a senha como salt:hash (scrypt) — a senha em si nunca é gravada. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Proteção por senha está ativa? */
export async function isAuthEnabled(): Promise<boolean> {
  return await getMeta("auth_password") != null;
}

/**
 * Cria uma sessão própria deste navegador (grava só o hash do token).
 * Cada dispositivo tem a sua — logar num PC não derruba os outros.
 */
export async function createSession(): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await run("INSERT INTO auth_sessions (token_hash) VALUES (?) ON CONFLICT DO NOTHING", tokenHash(token));
  return token;
}

export async function isValidSession(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  const hash = tokenHash(token);
  const row = await get<{ token_hash: string }>("SELECT token_hash FROM auth_sessions WHERE token_hash = ?", hash);
  if (row) return true;
  // sessão antiga (modelo de sessão única) continua valendo até o próximo logout
  const legacy = await getMeta("auth_session");
  return legacy != null && legacy === hash;
}

/** Encerra só a sessão deste navegador. */
export async function destroySession(token: string | null | undefined): Promise<void> {
  if (!token) return;
  const hash = tokenHash(token);
  await run("DELETE FROM auth_sessions WHERE token_hash = ?", hash);
  const legacy = await getMeta("auth_session");
  if (legacy === hash) await setMeta("auth_session", null);
}

/** Só pode ser chamada dentro de Server Actions (cookies de escrita). */
export async function setSessionCookie(token: string, remember = true): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // lembrado: 90 dias sem digitar senha; senão, a sessão morre ao fechar o navegador
    ...(remember ? { maxAge: 60 * 60 * 24 * 90 } : {}),
  });
}
