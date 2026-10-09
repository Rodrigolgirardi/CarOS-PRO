import { PageHeader } from "@/components/layout/page-header";
import { PlateCachePanel } from "@/components/plate-cache/plate-cache-panel";
import { AccessForm } from "@/components/settings/access-form";
import { CustomTypesPanel } from "@/components/settings/custom-types-panel";
import { FeedbackPanel } from "@/components/settings/feedback-panel";
import { ProfileForm } from "@/components/settings/profile-form";
import { LinkTabs } from "@/components/ui/tabs";
import { getProfile } from "@/lib/queries/profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Configurações" };

const BASE_TABS = [
  { key: "perfil", label: "Perfil", href: "/configuracoes" },
  { key: "seguranca", label: "Segurança", href: "/configuracoes?tab=seguranca" },
  { key: "banco", label: "Banco de dados", href: "/configuracoes?tab=banco" },
];

// desktop ganha as abas de tipos personalizados e feedback
const DESKTOP_TABS = [
  ...BASE_TABS,
  { key: "tipos", label: "Entradas e saídas", href: "/configuracoes?tab=tipos" },
  { key: "feedback", label: "Feedback", href: "/configuracoes?tab=feedback" },
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: tabParam } = await searchParams;
  const tab = ["seguranca", "banco", "tipos", "feedback"].includes(tabParam ?? "") ? tabParam! : "perfil";
  const profile = await getProfile();

  return (
    <>
      <PageHeader title="Configurações" description="Perfil, segurança, banco de dados e personalizações do CarOS." />
      <div className="lg:hidden">
        <LinkTabs className="mb-4" activeKey={tab} tabs={BASE_TABS} />
      </div>
      <div className="hidden lg:block">
        <LinkTabs className="mb-4" activeKey={tab} tabs={DESKTOP_TABS} />
      </div>
      {tab === "banco" ? (
        <PlateCachePanel />
      ) : tab === "tipos" ? (
        <CustomTypesPanel />
      ) : tab === "feedback" ? (
        <FeedbackPanel />
      ) : (
        <div className="max-w-2xl divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white shadow-card">
          {tab === "seguranca" ? (
            <AccessForm login={profile.login} authEnabled={profile.authEnabled} />
          ) : (
            <ProfileForm name={profile.name} avatarUrl={profile.avatarUrl} />
          )}
        </div>
      )}
    </>
  );
}
