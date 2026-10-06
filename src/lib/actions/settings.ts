"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  createSession,
  hashPassword,
  isAuthEnabled,
  setSessionCookie,
  verifyPassword,
} from "../auth";
import { getMeta, setMeta } from "../db";
import { deleteUpload, saveUpload } from "../uploads";
import type { ActionState } from "../types";
import { err, fields, ok } from "./util";

const revalidate = () => revalidatePath("/", "layout");

// ------------------------------------------------------------------- perfil

export async function saveProfile(prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const name = f.s("name");
  if (!name) return err("Informe o nome.");
  await setMeta("profile_name", name);

  const avatar = f.file("avatar");
  if (avatar) {
    if (!avatar.type.startsWith("image/")) return err("O avatar precisa ser uma imagem.");
    if (avatar.size > 5 * 1024 * 1024) return err("Imagem muito grande (máximo 5 MB).");
    const saved = await saveUpload(avatar);
    deleteUpload(await getMeta("profile_avatar"));
    await setMeta("profile_avatar", saved.fileName);
  }

  revalidate();
  return ok("Perfil salvo.");
}

export async function removeAvatar(): Promise<{ ok: boolean; error?: string }> {
  deleteUpload(await getMeta("profile_avatar"));
  await setMeta("profile_avatar", null);
  revalidate();
  return ok();
}

// ------------------------------------------------------------- login e senha

export async function saveCredentials(prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const login = f.s("login");
  const password = f.s("password");
  const confirm = f.s("confirm");
  if (!login) return err("Informe o usuário.");
  if (!password || password.length < 4) return err("A senha precisa de pelo menos 4 caracteres.");
  if (password !== confirm) return err("As senhas não conferem — digite a mesma senha nos dois campos.");

  // trocando senha existente exige a senha atual
  if (await isAuthEnabled()) {
    const current = f.s("current_password");
    if (!current || !verifyPassword(current, await getMeta("auth_password"))) return err("Senha atual incorreta.");
  }

  await setMeta("auth_login", login);
  await setMeta("auth_password", hashPassword(password));
  await setSessionCookie(await createSession()); // mantém este navegador conectado
  revalidate();
  return ok("Login salvo — o CarOS agora pede usuário e senha para abrir.");
}

export async function disableAuth(prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const current = f.s("current_password");
  if (!current || !verifyPassword(current, await getMeta("auth_password"))) return err("Senha atual incorreta.");
  await setMeta("auth_password", null);
  await setMeta("auth_session", null);
  revalidate();
  return ok("Proteção por senha desativada.");
}

export async function login(prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = fields(formData);
  const user = f.s("login");
  const password = f.s("password");
  if (!user || !password) return err("Preencha usuário e senha.");

  const expected = await getMeta("auth_login") ?? "";
  if (user.toLowerCase() !== expected.toLowerCase() || !verifyPassword(password, await getMeta("auth_password"))) {
    return err("Usuário ou senha incorretos.");
  }

  await setSessionCookie(await createSession());
  revalidate();
  return ok("Bem-vindo de volta!");
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  await setMeta("auth_session", null);
  revalidate();
}
