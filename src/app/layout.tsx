import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { LoginScreen } from "@/components/auth/login-screen";
import { DemoNotice } from "@/components/layout/demo-notice";
import { Sidebar } from "@/components/layout/sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { ToastProvider } from "@/components/ui/toast";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";
import { getProfile } from "@/lib/queries/profile";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "CarOS", template: "%s · CarOS" },
  description: "O sistema operacional da sua revenda.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  // proteção por senha: com login ativo e sem sessão válida, só a tela de entrada aparece
  let locked = false;
  if (profile.authEnabled) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    locked = !isValidSession(token);
  }

  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans">
        <ToastProvider>
          {locked ? (
            <LoginScreen name={profile.name} avatarUrl={profile.avatarUrl} />
          ) : (
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
          )}
        </ToastProvider>
      </body>
    </html>
  );
}
