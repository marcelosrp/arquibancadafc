import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";

// Placeholder: replaced by the real dashboard in Task 9.
async function Welcome() {
  const session = await auth();
  return (
    <>
      <h1 className="text-2xl font-bold">Olá, {session?.user?.name}</h1>
      <form action={logoutAction}>
        <Button type="submit" variant="outline">Sair</Button>
      </form>
    </>
  );
}

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <Suspense fallback={<p>Carregando…</p>}>
        <Welcome />
      </Suspense>
    </main>
  );
}
