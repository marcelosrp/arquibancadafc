import { Suspense } from "react";
import { ResetForm } from "./ResetForm";

async function ResetContent({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (token) return <ResetForm token={token} />;
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p>Link inválido. Solicite um novo.</p>
      <a href="/esqueci-senha" className="underline">Esqueci minha senha</a>
    </div>
  );
}

export default function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Redefinir senha</h1>
      <Suspense fallback={<p>Carregando…</p>}>
        <ResetContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
