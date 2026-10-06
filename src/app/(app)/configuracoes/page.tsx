import { PageHeader } from "@/components/layout/page-header";
import { AccessForm } from "@/components/settings/access-form";
import { AppearanceForm } from "@/components/settings/appearance-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { getProfile } from "@/lib/queries/profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Perfil, login e senha e aparência — tudo num lugar só."
      />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ProfileForm name={profile.name} avatarUrl={profile.avatarUrl} />
        <AccessForm login={profile.login} authEnabled={profile.authEnabled} />
        <AppearanceForm />
      </div>
    </>
  );
}
