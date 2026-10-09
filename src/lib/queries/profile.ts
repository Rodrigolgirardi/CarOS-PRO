import { all } from "../db";
import { uploadUrl } from "../uploads";

export interface Profile {
  name: string;
  avatarUrl: string | null;
  login: string | null;
  authEnabled: boolean;
}

/** Perfil do dono + estado da proteção por senha — UMA ida ao banco (roda em toda navegação). */
export async function getProfile(): Promise<Profile> {
  const rows = await all<{ key: string; value: string | null }>(
    "SELECT key, value FROM meta WHERE key IN ('profile_name','profile_avatar','auth_login','auth_password')"
  );
  const meta = new Map(rows.map((r) => [r.key, r.value]));
  const avatar = meta.get("profile_avatar");
  return {
    name: meta.get("profile_name") ?? "Minha loja",
    avatarUrl: avatar ? uploadUrl(avatar) : null,
    login: meta.get("auth_login") ?? null,
    authEnabled: meta.get("auth_password") != null,
  };
}
