import { Suspense } from "react";
import { ClubHeader } from "@/components/dashboard/ClubHeader";
import { CompetitionCard } from "@/components/dashboard/CompetitionCard";
import { NextMatch } from "@/components/dashboard/NextMatch";
import { requireUser } from "@/lib/auth";
import { getDashboard } from "@/modules/dashboard/service";

async function DashboardContent() {
  const user = await requireUser();
  const dashboard = await getDashboard(user.id);
  return (
    <>
      <ClubHeader
        name={dashboard.team.name}
        logo={dashboard.team.logo}
        season={dashboard.season}
      />
      <NextMatch match={dashboard.nextMatch} />
      {dashboard.competitions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma competição encontrada para a temporada {dashboard.season}.
        </p>
      ) : (
        <div id="competicoes" className="grid scroll-mt-6 gap-4 md:grid-cols-2">
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
    <Suspense fallback={<p>Carregando…</p>}>
      <DashboardContent />
    </Suspense>
  );
}
