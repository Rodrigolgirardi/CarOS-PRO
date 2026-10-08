import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DemoNotice } from "@/components/layout/demo-notice";
import { MobileTabBar } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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
        <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/40 px-3 sm:px-5">
          <div className="flex items-center gap-2 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/caros-mark.png" alt="" className="size-6 rounded-md object-cover" />
            <span className="text-sm font-semibold tracking-tight text-zinc-900">CarOS</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <UserMenu
              name={profile.name}
              avatarUrl={profile.avatarUrl}
              login={profile.login}
              authEnabled={profile.authEnabled}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-4 pb-24 sm:px-6 sm:py-6 sm:pb-24 lg:px-8 lg:pb-6">
            {children}
          </div>
        </div>
        <MobileTabBar />
      </main>
    </div>
  );
}
