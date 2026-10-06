import { getMeta } from "../db";
import { uploadUrl } from "../uploads";

export interface Profile {
  name: string;
  avatarUrl: string | null;
  login: string | null;
  authEnabled: boolean;
}

/** Perfil do dono + estado da proteção por senha (tudo na tabela meta). */
export async function getProfile(): Promise<Profile> {
  const avatar = await getMeta("profile_avatar");
  return {
    name: await getMeta("profile_name") ?? "Minha loja",
    avatarUrl: avatar ? uploadUrl(avatar) : null,
    login: await getMeta("auth_login"),
    authEnabled: await getMeta("auth_password") != null,
  };
}
