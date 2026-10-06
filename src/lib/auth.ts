import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getMeta, setMeta } from "./db";

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
export function isAuthEnabled(): boolean {
  return getMeta("auth_password") != null;
}

/** Cria a sessão (grava só o hash do token no banco) e devolve o token do cookie. */
export function createSession(): string {
  const token = randomBytes(32).toString("hex");
  setMeta("auth_session", tokenHash(token));
  return token;
}

export function isValidSession(token: string | null | undefined): boolean {
  if (!token) return false;
  const stored = getMeta("auth_session");
  return stored != null && stored === tokenHash(token);
}

/** Só pode ser chamada dentro de Server Actions (cookies de escrita). */
export async function setSessionCookie(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 dias
  });
}
