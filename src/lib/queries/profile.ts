import { getMeta } from "../db";
import { uploadUrl } from "../uploads";

export interface Profile {
  name: string;
  avatarUrl: string | null;
  login: string | null;
  authEnabled: boolean;
}

/** Perfil do dono + estado da proteção por senha (tudo na tabela meta). */
export function getProfile(): Profile {
  const avatar = getMeta("profile_avatar");
  return {
    name: getMeta("profile_name") ?? "Minha loja",
    avatarUrl: avatar ? uploadUrl(avatar) : null,
    login: getMeta("auth_login"),
    authEnabled: getMeta("auth_password") != null,
  };
}
