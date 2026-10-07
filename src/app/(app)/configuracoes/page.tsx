import { PageHeader } from "@/components/layout/page-header";
import { AccessForm } from "@/components/settings/access-form";
import { AppearanceForm } from "@/components/settings/appearance-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { LinkTabs } from "@/components/ui/tabs";
import { getProfile } from "@/lib/queries/profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Configurações" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: tabParam } = await searchParams;
  const tab = tabParam === "seguranca" ? "seguranca" : "perfil";
  const profile = await getProfile();

  return (
    <>
      <PageHeader title="Configurações" description="Perfil, aparência e a segurança do CarOS." />
      <LinkTabs
        className="mb-4"
        activeKey={tab}
        tabs={[
          { key: "perfil", label: "Perfil", href: "/configuracoes" },
          { key: "seguranca", label: "Segurança", href: "/configuracoes?tab=seguranca" },
        ]}
      />
      <div className="max-w-2xl divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
        {tab === "seguranca" ? (
          <AccessForm login={profile.login} authEnabled={profile.authEnabled} />
        ) : (
          <>
            <ProfileForm name={profile.name} avatarUrl={profile.avatarUrl} />
            <AppearanceForm />
          </>
        )}
      </div>
    </>
  );
}
