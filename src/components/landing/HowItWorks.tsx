const STEPS = [
  {
    title: "Crie sua conta",
    text: "Nome, e-mail e senha. Sem enrolação.",
  },
  {
    title: "Escolha o seu time",
    text: "Busque pelo nome e marque o clube do coração.",
  },
  {
    title: "Acompanhe tudo num painel só",
    text: "Próxima partida, tabela, artilheiro e assistências do seu clube, sempre que quiser.",
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-title"
      className="relative isolate overflow-hidden border-y bg-card/60"
    >
      <div aria-hidden className="absolute inset-0 -z-10 pitch-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="font-heading text-sm font-semibold tracking-widest text-primary uppercase">
            Em três lances
          </p>
          <h2
            id="how-title"
            className="font-heading text-4xl leading-none font-extrabold tracking-tight uppercase sm:text-5xl"
          >
            Como funciona
          </h2>
        </div>
        <div className="relative mt-12">
          {/* Linha que liga os passos no desktop */}
          <div aria-hidden className="absolute top-8 right-[16%] left-[16%] hidden h-0.5 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 md:block" />
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative flex flex-col items-center gap-3 text-center">
                <span
                  aria-hidden
                  className="relative flex size-16 items-center justify-center rounded-full border-2 border-primary bg-background font-heading text-3xl font-extrabold text-primary shadow-lg shadow-primary/15 tabular-nums"
                >
                  {index + 1}
                </span>
                <h3 className="font-heading text-2xl leading-none font-bold tracking-wide uppercase">
                  <span className="sr-only">Passo {index + 1}: </span>
                  {step.title}
                </h3>
                <p className="max-w-xs text-sm text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
