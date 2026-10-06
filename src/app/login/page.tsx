import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginScreen } from "@/components/auth/login-screen";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";
import { getProfile } from "@/lib/queries/profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entrar" };

/** /login — quem já está logado (ou sem senha ativa) volta para o app. */
export default async function LoginPage() {
  const profile = await getProfile();
  if (!profile.authEnabled) redirect("/");
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (await isValidSession(token)) redirect("/");

  return <LoginScreen name={profile.name} avatarUrl={profile.avatarUrl} />;
}
