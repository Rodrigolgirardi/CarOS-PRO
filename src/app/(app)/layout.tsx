import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DemoNotice } from "@/components/layout/demo-notice";
import { Sidebar } from "@/components/layout/sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";
import { getProfile } from "@/lib/queries/profile";

/** Área protegida: com login ativo e sem sessão válida, vai para /login. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  if (profile.authEnabled) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!(await isValidSession(token))) redirect("/login");
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar>
        <DemoNotice />
      </Sidebar>
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center justify-end border-b border-zinc-100 bg-zinc-50/40 px-5">
          <UserMenu
            name={profile.name}
            avatarUrl={profile.avatarUrl}
            login={profile.login}
            authEnabled={profile.authEnabled}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1200px] px-8 py-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
