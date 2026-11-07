import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/modules/users/profile";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TeamLogo } from "@/components/shared/TeamLogo";
import { ProfileForm } from "./ProfileForm";

async function ProfileContent() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="min-w-0">
        <div className="flex min-w-0 items-center gap-4">
          <TeamLogo
            name={profile.favoriteTeam.name}
            src={profile.favoriteTeam.logo}
            size={56}
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate font-heading text-xl font-semibold">
              {profile.name}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              <span className="sr-only">E-mail: </span>
              {profile.email}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="font-medium">Time do coração</dt>
          <dd>{profile.favoriteTeam.name}</dd>
        </dl>
        <p className="text-xs text-muted-foreground">
          O time favorito é definido no cadastro e não pode ser alterado.
        </p>
        <ProfileForm name={profile.name} />
      </CardContent>
    </Card>
  );
}

export default function PerfilPage() {
  return (
    <>
      <h1 className="font-heading text-3xl font-bold tracking-wide uppercase">
        Perfil
      </h1>
      <Suspense fallback={<Skeleton className="h-64 w-full max-w-md" />}>
        <ProfileContent />
      </Suspense>
    </>
  );
}
