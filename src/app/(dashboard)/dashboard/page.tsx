import { Suspense } from "react";
import { logoutAction } from "@/app/(auth)/actions";
import { ClubHeader } from "@/components/dashboard/ClubHeader";
import { CompetitionCard } from "@/components/dashboard/CompetitionCard";
import { NextMatch } from "@/components/dashboard/NextMatch";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getDashboard } from "@/modules/dashboard/service";

async function DashboardContent() {
  const user = await requireUser();
  const dashboard = await getDashboard(user.id);
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <ClubHeader
          name={dashboard.team.name}
          logo={dashboard.team.logo}
          season={dashboard.season}
        />
        <form action={logoutAction}>
          <Button type="submit" variant="outline">
            Sair
          </Button>
        </form>
      </div>
      <NextMatch match={dashboard.nextMatch} />
      {dashboard.competitions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma competição encontrada para a temporada {dashboard.season}.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {dashboard.competitions.map((c) => (
            <CompetitionCard key={c.id} competition={c} />
          ))}
        </div>
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-8">
      <Suspense fallback={<p>Carregando…</p>}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}
