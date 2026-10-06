import { PageHeader } from "@/components/layout/page-header";
import { AccessForm } from "@/components/settings/access-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { getProfile } from "@/lib/queries/profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Configurações" };

export default function SettingsPage() {
  const profile = getProfile();

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Seu perfil, sua foto e a proteção de acesso do CarOS neste computador."
      />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ProfileForm name={profile.name} avatarUrl={profile.avatarUrl} />
        <AccessForm login={profile.login} authEnabled={profile.authEnabled} />
      </div>
    </>
  );
}
