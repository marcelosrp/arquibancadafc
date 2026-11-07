import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Features } from "@/components/landing/Features";
import { FinalCta } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";

/** Quem já tem sessão vai direto para o painel. Lê cookies, então fica atrás do Suspense. */
async function RedirectIfLoggedIn() {
  // Sem cookie de sessão o Auth.js gera valores aleatórios; isso só pode rodar na requisição.
  await connection();
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return null;
}

export default function Home() {
  return (
    <>
      <Suspense fallback={null}>
        <RedirectIfLoggedIn />
      </Suspense>
      <LandingHeader />
      <main className="flex flex-1 flex-col">
        <Hero />
        <Features />
        <HowItWorks />
        <FinalCta />
      </main>
      <LandingFooter />
    </>
  );
}
