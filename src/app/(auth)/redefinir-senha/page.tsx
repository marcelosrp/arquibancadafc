import { Suspense } from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { ResetForm } from "./ResetForm";

async function ResetContent({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (token) return <ResetForm token={token} />;
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p>Link inválido. Solicite um novo.</p>
      <a href="/esqueci-senha" className="font-medium text-primary underline underline-offset-4">Esqueci minha senha</a>
    </div>
  );
}

export default function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <AuthCard title="Redefinir senha">
      <Suspense fallback={<p>Carregando…</p>}>
        <ResetContent searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
