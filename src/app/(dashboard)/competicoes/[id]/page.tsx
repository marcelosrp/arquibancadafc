import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { CompetitionDetailView } from "@/components/competitions/CompetitionDetailView";
import { requireUser } from "@/lib/auth";
import { getCompetitionDetail } from "@/modules/competitions/detail";
import { CompetitionNotFoundError } from "@/modules/competitions/service";

async function CompetitionContent({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const detail = await getCompetitionDetail(id, user.id).catch((error: unknown) => {
    if (error instanceof CompetitionNotFoundError) return null;
    throw error;
  });
  if (!detail) notFound();
  return <CompetitionDetailView detail={detail} />;
}

export default function CompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Link href="/dashboard" className="text-sm underline">
        Voltar ao dashboard
      </Link>
      <Suspense fallback={<p>Carregando…</p>}>
        <CompetitionContent params={params} />
      </Suspense>
    </>
  );
}
