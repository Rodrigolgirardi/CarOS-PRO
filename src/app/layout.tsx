import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { DemoNotice } from "@/components/layout/demo-notice";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "CarOS", template: "%s · CarOS" },
  description: "O sistema operacional da sua revenda.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans">
        <ToastProvider>
          <div className="flex h-dvh overflow-hidden">
            <Sidebar>
              <DemoNotice />
            </Sidebar>
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-[1200px] px-8 py-7">{children}</div>
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
