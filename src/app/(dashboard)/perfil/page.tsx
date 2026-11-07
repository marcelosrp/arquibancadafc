import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/modules/users/profile";
import { ProfileForm } from "./ProfileForm";

async function ProfileContent() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  return (
    <>
      <dl className="grid max-w-sm grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="font-medium">E-mail</dt>
        <dd>{profile.email}</dd>
        <dt className="font-medium">Time do coração</dt>
        <dd>{profile.favoriteTeam.name}</dd>
      </dl>
      <p className="text-xs text-muted-foreground">
        O time favorito é definido no cadastro e não pode ser alterado.
      </p>
      <ProfileForm name={profile.name} />
    </>
  );
}

export default function PerfilPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Perfil</h1>
      <Suspense fallback={<p>Carregando…</p>}>
        <ProfileContent />
      </Suspense>
    </>
  );
}
