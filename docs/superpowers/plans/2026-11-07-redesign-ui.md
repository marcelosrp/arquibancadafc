# Redesign da interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar identidade visual (tema claro "Placar claro" e escuro "Estádio à noite", escolhido pelo usuário) a todas as telas do Arquibancada, com shadcn/ui e fontes do Google Fonts, sem alterar API, banco ou autenticação.

**Architecture:** Tokens de design em `globals.css` (oklch, `:root` claro e `.dark` escuro) alimentam componentes shadcn. Um script inline no `<head>` aplica a classe `.dark` antes da hidratação, a partir de `localStorage`. Telas logadas ganham um `(dashboard)/layout.tsx` com `AppShell` (barra lateral no desktop, barra inferior no celular, uma única árvore DOM). Cada tela é migrada em sua própria tarefa, preservando a semântica que os testes usam.

**Tech Stack:** Next 16.4.3 (`cacheComponents: true`), React 19.3, Tailwind v4, shadcn `base-nova` (`@base-ui/react`), lucide-react, `next/font/google` (Barlow Condensed + Inter), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-07-redesign-ui-design.md`

## Global Constraints

- Ler `node_modules/next/dist/docs/` (guias de `next/font`, layouts, `cacheComponents`) antes de codar; rodar `npm install` primeiro, pois o worktree não tem `node_modules` (`AGENTS.md`).
- Tipografia única nos dois modos: títulos/placares em Barlow Condensed (pesos 600/700/800), texto/UI em Inter variável, subsets `latin` + `latin-ext`. Geist é removida.
- Claro = mockup B (fundo ~`#f6f7f2`, cards brancos, borda `#e3e6dc`, destaque `#0f7a43`, texto `#14231b`); escuro = mockup A (fundo ~`#0b1410`, superfícies `#13211a`/`#0f1b15`, borda `#1f3a2b`, destaque `#b6ff3c`, texto `#e8f3ec`). Converter para oklch nos tokens; contraste AA.
- Seletor de tema: Claro / Escuro / Sistema; padrão Sistema; persistido em `localStorage`; sem `useEffect` (anti-padrão do projeto), sem tornar o layout raiz dinâmico.
- Sem mudanças em `src/modules/*`, API routes, Prisma, Auth.js, regras de cache.
- Sem novas páginas (exceto o redesign da home `/` como landing); item "Competições" do menu leva a `/dashboard#competicoes`.
- Não quebrar testes: manter roles/nomes acessíveis ("Entrar", "Sair", "Criar conta", "Salvar"), headings, labels ("E-mail", "Senha", "Nome", "Time do coração"), região "Próxima partida", `data-testid="stages-view"`, atributos `name` dos inputs, "Dado indisponível", "Selecionado: …". Só um "Sair" no DOM.
- Responsivo mobile-first, foco visível, `prefers-reduced-motion` respeitado, `tabular-nums` em placares e números.
- Textos de interface em português do Brasil.

## Review Focus

1. `localStorage` bloqueado/lançando exceção (janela privada): tema cai em Sistema sem erro de console (Task 1).
2. Preferência "Sistema" e o usuário troca o tema do SO com a página aberta: a página acompanha sem recarregar (Task 1/2).
3. Nome de time muito longo ou `logo: null`: sem quebra de layout, fallback com iniciais (Task 5).
4. Tabela de classificação em 360px de largura: rolagem horizontal contida, sem rolagem da página (Task 6).
5. Estados "Dado indisponível"/stale legíveis nos dois temas (Task 5).
6. Visitante em `/dashboard` continua indo ao login e logado em `/` vai ao dashboard (Task 8).

---

### Task 1: Fundação — fontes, tokens e lógica de tema

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/globals.css`
- Create: `src/lib/theme.ts`
- Test: `tests/unit/theme.test.ts`

**Interfaces:**
- Produces (`src/lib/theme.ts`):
  - `type ThemePreference = "light" | "dark" | "system"`
  - `const THEME_STORAGE_KEY = "arquibancada-theme"`
  - `parsePreference(raw: string | null): ThemePreference` (valor inválido ou nulo → `"system"`)
  - `resolveTheme(pref: ThemePreference, systemDark: boolean): "light" | "dark"`
  - `themeInitScript: string` (IIFE autocontida: lê `localStorage` em try/catch, aplica/remove classe `dark` em `document.documentElement`, e registra um listener `matchMedia("(prefers-color-scheme: dark)")` que reaplica o tema quando a preferência salva é `system`)
- Produces (CSS): variáveis `--font-sans` (Inter), `--font-heading` (Barlow Condensed), `--font-mono`; classe utilitária `font-heading`; tokens shadcn completos (`--background`, `--card`, `--primary`, `--accent`, `--border`, `--ring`, `--chart-1..5`, sidebar) para `:root` e `.dark`.

- [ ] **Step 1: `npm install` e leitura dos guias de `next/font` em `node_modules/next/dist/docs/`.**
- [ ] **Step 2: Escrever `tests/unit/theme.test.ts`** com: `parsePreference(null)==="system"`; `parsePreference("lixo")==="system"`; `parsePreference("dark")==="dark"`; `resolveTheme("system", true)==="dark"`; `resolveTheme("light", true)==="light"`; `themeInitScript` executado em `node:vm` com `localStorage` falso contendo `"dark"` adiciona a classe `dark` ao `documentElement` falso; com `localStorage.getItem` lançando exceção, não lança e usa `matchMedia`; com preferência `system` e `matchMedia.matches=true`, aplica `dark`, e disparar o listener `change` com `matches=false` remove `dark`.
- [ ] **Step 3: Rodar `npx vitest run --project unit tests/unit/theme.test.ts`.** Esperado: FALHA (módulo inexistente).
- [ ] **Step 4: Implementar `src/lib/theme.ts`** conforme as assinaturas acima.
- [ ] **Step 5: Rodar o teste.** Esperado: PASSA.
- [ ] **Step 6: Atualizar `layout.tsx`:** trocar Geist por `Inter` (variable `--font-inter`) e `Barlow_Condensed` (variable `--font-barlow`, weights `["600","700","800"]`); adicionar `suppressHydrationWarning` no `<html>`; injetar `<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />` no `<head>`; manter metadata.
- [ ] **Step 7: Atualizar `globals.css`:** corrigir a referência circular (`--font-sans: var(--font-inter)`, `--font-heading: var(--font-barlow)`), definir os tokens claro/escuro com os valores da seção Global Constraints, `--radius: 0.75rem`, e `@media (prefers-reduced-motion: reduce)` desligando animações.
- [ ] **Step 8: Verificar:** `npm run lint && npm run build`. Esperado: sem erros; fontes carregadas sem aviso.
- [ ] **Step 9: Commit** `feat(ui): fonts, design tokens and theme logic`.

### Task 2: Seletor de tema

**Files:**
- Create: `src/components/theme/ThemeToggle.tsx`; `src/components/ui/dropdown-menu.tsx` (via shadcn)
- Modify: `src/lib/theme.ts` (adicionar `applyTheme`)
- Test: `tests/e2e/theme.spec.ts`

**Interfaces:**
- Consumes: Task 1 (`THEME_STORAGE_KEY`, `parsePreference`, `resolveTheme`).
- Produces: `applyTheme(pref: ThemePreference): void` (grava em `localStorage` em try/catch e ajusta a classe `dark`); `<ThemeToggle />` (client component, botão com nome acessível "Tema" e itens de menu "Claro", "Escuro", "Sistema"), usando handler `onClick`/`onSelect`, sem `useEffect`.

- [ ] **Step 1: `npx shadcn@latest add dropdown-menu`.**
- [ ] **Step 2: Escrever `tests/e2e/theme.spec.ts`:** (a) abrir `/login`, escolher "Escuro" no menu "Tema" → `html` tem classe `dark`; recarregar → continua `dark` e a classe está presente antes da hidratação (checar via `page.addInitScript`/primeiro paint, sem flash); (b) escolher "Claro" → sem classe `dark`; (c) com `colorScheme: "dark"` emulado e "Sistema" → `dark`; `page.emulateMedia({ colorScheme: "light" })` → perde `dark` sem recarregar.
- [ ] **Step 3: Rodar `npx playwright test tests/e2e/theme.spec.ts`.** Esperado: FALHA.
- [ ] **Step 4: Implementar `applyTheme` e `ThemeToggle`** (ícones lucide `Sun`, `Moon`, `Monitor`); incluí-lo temporariamente no `src/app/layout.tsx` raiz apenas para o teste passar (a Task 3 o move para `(auth)/layout.tsx` e a Task 4 para o `AppShell`; remover do layout raiz na Task 3).
- [ ] **Step 5: Rodar o teste.** Esperado: PASSA.
- [ ] **Step 6: Commit** `feat(ui): theme switcher`.

### Task 3: Layout de autenticação e formulários

**Files:**
- Create: `src/app/(auth)/layout.tsx`; shadcn `card`, `input`, `label` em `src/components/ui/`
- Modify: `src/components/ui/button.tsx` (variantes no visual novo), `LoginForm.tsx`, `SignUpForm.tsx`, `ForgotForm.tsx`, `ResetForm.tsx`, as quatro `page.tsx` de `(auth)`, `src/components/teams/TeamPicker.tsx`
- Test: `tests/e2e/auth.spec.ts`, `tests/e2e/signup-dashboard.spec.ts` (existentes devem continuar passando)

**Interfaces:**
- Consumes: `ThemeToggle` (Task 2).
- Produces: layout de auth com duas colunas no desktop (painel de marca com título em `font-heading` e frase de valor; formulário em `Card`) e uma coluna no celular, `ThemeToggle` no canto; `Button` com variantes `default` (destaque), `outline`, `ghost`, `destructive` e `size` `sm|default|lg`.

- [ ] **Step 1: Rodar a suíte E2E de auth** para registrar a linha de base: `npx playwright test tests/e2e/auth.spec.ts tests/e2e/signup-dashboard.spec.ts`. Esperado: PASSA.
- [ ] **Step 2: `npx shadcn@latest add card input label`.**
- [ ] **Step 3: Criar `(auth)/layout.tsx`** e migrar os quatro formulários para `Card`/`Input`/`Label`, mantendo `name` dos inputs, labels e textos de erro ("E-mail ou senha inválidos."); mensagens de erro com `role="alert"`/`aria-live`.
- [ ] **Step 4: Migrar `TeamPicker`** mantendo roles `combobox`/`option`/`searchbox` e o texto `Selecionado: ${team}`; escudo com `next/image` ou fallback de iniciais (componente `TeamLogo` criado na Task 5; aqui usar `<img>` simples e trocar na Task 5).
- [ ] **Step 5: Rodar de novo os E2E de auth.** Esperado: PASSA, sem alterar os testes.
- [ ] **Step 6: Verificação visual** em 360px e 1280px, claro e escuro (`npm run dev`, abrir `/login`, `/cadastro`).
- [ ] **Step 7: Commit** `feat(ui): auth screens redesign`.

### Task 4: Shell das telas logadas (barra lateral e barra inferior)

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`, `src/components/layout/AppShell.tsx`, `src/components/layout/NavItems.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx` (remover Perfil/Sair e o `<main>` externo), `competicoes/[id]/page.tsx`, `perfil/page.tsx` (idem)
- Test: `tests/e2e/shell.spec.ts`; ajustes pontuais em `tests/e2e/*.spec.ts` que usam "Sair"

**Interfaces:**
- Consumes: `ThemeToggle` (Task 2), `logoutAction` de `src/app/(auth)/actions.ts`.
- Produces: `<AppShell>{children}</AppShell>` — barra lateral fixa `md:` com logo "Arquibancada" (`font-heading`, destaque), itens Dashboard (`/dashboard`), Competições (`/dashboard#competicoes`), Perfil (`/perfil`), `ThemeToggle` e botão "Sair" (form com `logoutAction`); abaixo de `md` a mesma árvore vira barra inferior fixa (ícones + rótulos). Item ativo com `aria-current="page"`. Conteúdo em `<main>` único.

- [ ] **Step 1: Escrever `tests/e2e/shell.spec.ts`:** após login, existe exatamente um botão "Sair" (`getByRole("button",{name:"Sair"})` com `toHaveCount(1)`) em 1280px e em 390px; link "Perfil" navega e marca `aria-current="page"`; "Competições" leva a `/dashboard#competicoes`; `page.locator("main")` tem contagem 1.
- [ ] **Step 2: Rodar.** Esperado: FALHA.
- [ ] **Step 3: Implementar shell e layout**, mover Perfil/Sair para a navegação; páginas passam a renderizar apenas o conteúdo.
- [ ] **Step 4: Rodar `shell.spec.ts` e toda a suíte E2E** (`npx playwright test`). Esperado: PASSA; ajustar apenas seletores que dependiam da posição do "Sair", registrando a mudança no commit.
- [ ] **Step 5: Commit** `feat(ui): app shell with sidebar and bottom bar`.

### Task 5: Dashboard

**Files:**
- Create: `src/components/ui/{badge,skeleton,separator,avatar}.tsx` (shadcn), `src/components/shared/TeamLogo.tsx`
- Modify: `src/components/dashboard/{ClubHeader,NextMatch,CompetitionCard,Unavailable,LastUpdated}.tsx`, `src/app/(dashboard)/dashboard/page.tsx`, `next.config.ts` (`images.remotePatterns`), `src/components/teams/TeamPicker.tsx`
- Test: `tests/unit/team-logo.test.tsx`; `tests/e2e/signup-dashboard.spec.ts` (existente)

**Interfaces:**
- Produces: `<TeamLogo name: string; src: string | null; size?: number />` — imagem via `next/image` quando `src`, senão círculo com até duas iniciais do nome; `alt` = nome do time.

- [ ] **Step 1: Teste `team-logo.test.tsx`** com `renderToStaticMarkup`: `src=null,name="Flamengo"` → contém "FL"; `name="Atlético Mineiro"` → "AM"; nome de 80 caracteres → markup com classe `truncate`; `src` presente → `<img` com `alt="Flamengo"`.
- [ ] **Step 2: Rodar.** Esperado: FALHA.
- [ ] **Step 3: Implementar `TeamLogo`** e configurar `remotePatterns` com o host dos logos presente em `tests/fixtures/api-football/*.json` (verificar o host real nos fixtures).
- [ ] **Step 4: Redesenhar** `ClubHeader` (escudo grande, nome em `font-heading`, temporada em `Badge`), `NextMatch` (placar/confronto em `font-heading` com `tabular-nums`, mantendo `<section aria-labelledby="next-match">` e o heading "Próxima partida"), `CompetitionCard` (logo, nome, link), `Unavailable` ("Dado indisponível" com contraste AA nos dois temas), `LastUpdated`; skeleton no `Suspense` fallback; a seção de competições recebe `id="competicoes"`.
- [ ] **Step 5: Rodar unit + E2E do dashboard.** Esperado: PASSA.
- [ ] **Step 6: Verificação visual** (claro/escuro, 360px/1280px, nome longo, sem logo).
- [ ] **Step 7: Commit** `feat(ui): dashboard redesign`.

### Task 6: Detalhe da competição

**Files:**
- Create: `src/components/ui/{table,tabs}.tsx` (shadcn)
- Modify: `src/components/competitions/{CompetitionDetailView,CompetitionStandings,StandingsTable,StagesView,PlayerRanking,FixtureList}.tsx`, `src/app/(dashboard)/competicoes/[id]/page.tsx`
- Test: `tests/unit/competition-standings.test.tsx` e `tests/e2e/competition.spec.ts` (existentes)

**Interfaces:**
- Consumes: `TeamLogo` (Task 5).
- Produces: classificação em `Table` dentro de contêiner `overflow-x-auto` (rolagem só da tabela), posições Z4/G4 destacadas por cor + texto acessível (não só cor), artilheiros/assistências como listas com posição em `font-heading`, jogos em cards; `StagesView` mantém `data-testid="stages-view"`.

- [ ] **Step 1: Rodar linha de base:** `npx vitest run --project unit tests/unit/competition-standings.test.tsx` e `npx playwright test tests/e2e/competition.spec.ts`. Esperado: PASSA.
- [ ] **Step 2: Adicionar ao E2E** uma checagem em viewport 360px: `document.documentElement.scrollWidth <= innerWidth` na página de competição.
- [ ] **Step 3: `npx shadcn@latest add table tabs`** e migrar os componentes, mantendo h1 do nome da competição, headings "Classificação", "Fases", "Assistências", roles de tabela/lista e `data-testid`.
- [ ] **Step 4: Rodar unit e E2E.** Esperado: PASSA.
- [ ] **Step 5: Commit** `feat(ui): competition detail redesign`.

### Task 7: Perfil

**Files:**
- Modify: `src/app/(dashboard)/perfil/page.tsx`, `src/app/(dashboard)/perfil/ProfileForm.tsx`
- Test: `tests/e2e/profile.spec.ts` (existente)

**Interfaces:** Consumes `Card`, `Input`, `Label`, `Button`, `TeamLogo`, `TeamPicker`.

- [ ] **Step 1: Rodar linha de base** `npx playwright test tests/e2e/profile.spec.ts`. Esperado: PASSA.
- [ ] **Step 2: Migrar** a página para `Card` com avatar/escudo do time e `ProfileForm` com os componentes novos, mantendo labels, o texto "não pode ser alterado", botão "Salvar" e mensagens de status (`role="status"`).
- [ ] **Step 3: Rodar de novo.** Esperado: PASSA.
- [ ] **Step 4: Commit** `feat(ui): profile redesign`.

### Task 8: Landing page `/`

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/landing/{Hero,DashboardPreview,Features,HowItWorks,FinalCta,LandingHeader,LandingFooter}.tsx`
- Test: `tests/e2e/landing.spec.ts`

**Interfaces:**
- Consumes: `ThemeToggle`, `Button`, `Card`, `Badge`, `getCurrentUser` de `@/lib/auth`.
- Produces: página pública com header (logo, `ThemeToggle`, links "Entrar" → `/login` e "Criar conta" → `/cadastro`), hero (proposta de valor em `font-heading`, subtítulo explicando que o app reúne próxima partida, classificação, artilheiro, assistências e competições do clube do coração, CTAs "Criar conta" e "Entrar"), `DashboardPreview` estático com dados de exemplo (sem chamadas à API), seção de benefícios, "Como funciona" em 3 passos (criar conta, escolher o time, acompanhar), CTA final e rodapé. Usuário logado: componente async dentro de `<Suspense>` que chama `getCurrentUser()` e `redirect("/dashboard")` (compatível com `cacheComponents`).

- [ ] **Step 1: Escrever `tests/e2e/landing.spec.ts`:** visitante em `/` vê `h1` não vazio, links "Entrar" e "Criar conta" apontando para `/login` e `/cadastro`, os 3 passos de "Como funciona"; logado em `/` termina em `/dashboard`; `/dashboard` sem sessão termina em `/login`; em 360px sem rolagem horizontal da página.
- [ ] **Step 2: Rodar.** Esperado: FALHA.
- [ ] **Step 3: Implementar** as seções (copy em português, tom de torcedor, rascunho para o usuário revisar) e o redirecionamento.
- [ ] **Step 4: Rodar `landing.spec.ts`.** Esperado: PASSA.
- [ ] **Step 5: Verificação visual** claro/escuro, 360px/768px/1280px.
- [ ] **Step 6: Commit** `feat(ui): marketing landing page`.

### Task 9: Fechamento — acessibilidade, regressão e docs

**Files:**
- Modify: `README.md` (nota curta sobre tema, fontes e como adicionar componentes shadcn)
- Test: suíte completa

- [ ] **Step 1: `npm run lint && npm test && npm run build && npx playwright test`.** Esperado: tudo passa.
- [ ] **Step 2: Checagem de contraste AA** dos pares texto/fundo, destaque/fundo e borda nos dois temas (ferramenta à escolha, ex.: axe via Playwright); corrigir tokens que falharem.
- [ ] **Step 3: Verificação manual:** navegação só por teclado nas telas principais (foco visível), `prefers-reduced-motion`, sem flash de tema ao recarregar.
- [ ] **Step 4: Atualizar README e commit** `docs: ui theming notes`.
