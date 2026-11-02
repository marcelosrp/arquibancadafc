# Arquibancada MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o MVP do Arquibancada: dashboard personalizado do clube favorito com competições, classificação, artilheiro, líder de assistências e próxima partida, alimentado pela API-Football com cache compartilhado.

**Architecture:** Monólito Next.js (App Router). Páginas são Server Components que chamam serviços em `src/modules/`*; Route Handlers em `src/app/api/*` expõem os contratos REST. Toda chamada externa passa por `src/server/api-football/client.ts` e por uma camada de cache em PostgreSQL (`ApiCache`) com TTL por tipo de dado e fallback para dado vencido. Módulos de domínio não importam React.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL, Prisma, Zod, Auth.js (`next-auth@beta`, Credentials, JWT), `@node-rs/argon2`, Resend, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-01-arquibancada-mvp-design.md` (e, como fonte do produto, `.docs/arquibancada-brainstorm.md`).

## Global Constraints

- Navegador nunca chama a API-Football; `API_FOOTBALL_KEY` nunca em `NEXT_PUBLIC_*`.
- Base da API: `https://v3.football.api-sports.io`, header `x-apisports-key`.
- Plano gratuito: 100 requisições/dia, ~10/minuto, temporadas 2022–2024 apenas. Uma chamada externa nunca é feita por usuário.
- Temporada vem de `SEASON_OVERRIDE` (dev: `2024`); sem ela, usa a temporada `current` da API. Nunca fixar o ano no código; a UI sempre mostra o ano exibido.
- Dado ausente é exibido como "indisponível", nunca `0` nem valor inventado.
- Copas/eliminatórias não usam tabela de pontos corridos.
- Senha só como hash Argon2id. Sessão em cookie `HttpOnly`. Autorização validada no servidor; usuário só altera os próprios dados.
- Time favorito não pode ser alterado depois do cadastro.
- Identificadores externos persistidos como `externalId`; nunca usar nomes como chave.
- Variáveis de ambiente validadas com Zod na inicialização: `DATABASE_URL`, `API_FOOTBALL_BASE_URL`, `API_FOOTBALL_KEY`, `AUTH_SECRET`, `CRON_SECRET`, `SEASON_OVERRIDE?`, `RESEND_API_KEY?`.
- Não logar senhas, tokens ou chaves.
- Testes automatizados usam respostas mockadas da API-Football.

## Review Focus

1. Competição sem cobertura de assistências/artilharia (resposta vazia): UI mostra "indisponível", não `0`. (Task 8, 10)
2. Copa/torneio eliminatório com `standings` vazio ou em grupos: sem tabela de liga, apresentação por fase. (Task 8, 10)
3. API responde `429`/timeout/5xx: serve o último dado salvo com aviso de desatualizado; sem dado salvo, estado de erro claro. (Task 4, 7)
4. Clube sem partida futura (sempre o caso em 2024): estado vazio "sem próxima partida". (Task 8, 9)
5. E-mail duplicado com caixa diferente (`A@x.com` vs `a@x.com`) e senha curta/fraca no cadastro. (Task 5)
6. Rota de cron sem o segredo correto: `401`, sem efeito colateral. (Task 11)

## File Structure

| Caminho | Responsabilidade |
|---|---|
| `src/lib/env.ts` | Validação Zod das variáveis de ambiente |
| `src/lib/prisma.ts` | Singleton do Prisma Client |
| `src/lib/season.ts` | `resolveSeason` |
| `src/server/api-football/client.ts` | HTTP, retry/backoff, `429`, log de consumo |
| `src/server/api-football/{leagues,teams,standings,players,fixtures}.ts` | Chamadas por endpoint + schemas Zod + mapeamento para tipos internos |
| `src/server/cache/api-cache.ts` | `getOrFetch` com TTL, stale-while-error |
| `src/server/rate-limit.ts` | Rate limit por chave/janela em Postgres |
| `src/modules/auth/*` | Registro, hash, reset de senha |
| `src/modules/users/*` | Perfil |
| `src/modules/teams/*` | Sincronização e busca de clubes |
| `src/modules/competitions/*` | Competições do clube, classificação, artilharia, assistências, partidas |
| `src/modules/dashboard/*` | Agregação do dashboard |
| `src/app/api/**/route.ts` | Contratos REST (seção 7 do brainstorm) |
| `src/app/(auth)/*`, `src/app/(dashboard)/*` | Páginas |
| `tests/{unit,integration,e2e}` | Testes; mocks em `tests/fixtures/api-football/*.json` |

---

### Task 1: Fundação do projeto

**Files:**

- Create: projeto Next.js na raiz (`package.json`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`), `src/lib/env.ts`, `.env.example`, `vitest.config.ts`, `tests/unit/env.test.ts`

**Interfaces:**

- Produces: `env` (objeto tipado e validado) exportado de `src/lib/env.ts`; `parseEnv(raw: Record<string, string | undefined>): Env`.

- [x] **Step 1:** Inicializar com `create-next-app` (TypeScript, Tailwind, App Router, `src/` dir, ESLint) no diretório atual preservando `.docs/` e `docs/`; rodar `npx shadcn@latest init`; instalar `zod vitest @vitest/coverage-v8`. Script `"test": "vitest run"`.
- [x] **Step 2: Teste falho** `tests/unit/env.test.ts`: `parseEnv({})` lança erro citando `DATABASE_URL`; `parseEnv(validRaw)` retorna `API_FOOTBALL_BASE_URL === "https://v3.football.api-sports.io"` quando omitida (default); `SEASON_OVERRIDE: "2024"` vira número `2024`; `SEASON_OVERRIDE: "abc"` lança.
- [x] **Step 3:** Rodar `npx vitest run tests/unit/env.test.ts`. Esperado: FAIL (módulo inexistente).
- [x] **Step 4:** Implementar `parseEnv` e `env = parseEnv(process.env)` em `src/lib/env.ts` com Zod (`z.coerce.number().int().optional()` para a temporada). Criar `.env.example` com todas as variáveis, sem valores reais.
- [x] **Step 5:** Rodar o teste. Esperado: PASS. Rodar `npm run build`. Esperado: sucesso.
- [x] **Step 6:** Commit `chore: scaffold next app with env validation`.

---

### Task 2: Banco e schema Prisma

**Files:**

- Create: `prisma/schema.prisma`, `src/lib/prisma.ts`, `docker-compose.yml` (Postgres local), `tests/integration/setup.ts`, `tests/integration/schema.test.ts`
- Modify: `vitest.config.ts` (projeto `integration` com `DATABASE_URL` de teste)

**Interfaces:**

- Produces: modelos Prisma — `User{id uuid, name, email @unique (minúsculo), passwordHash, favoriteTeamId, createdAt, updatedAt}`; `Team{id, externalId Int @unique, name, logo?, country}`; `Competition{id, externalId Int @unique, name, type?, country?}`; `Season{id, competitionId, year Int, startDate?, endDate?, @@unique([competitionId, year])}`; `TeamCompetition{id, teamId, seasonId, @@unique([teamId, seasonId])}`; `ApiCache{key @id, payload Json, fetchedAt, expiresAt}`; `ApiUsage{id, endpoint, status Int, remainingDay Int?, createdAt}`; `PasswordResetToken{id, userId, tokenHash @unique, expiresAt, usedAt?}`; `RateLimit{key, windowStart, count, @@id([key, windowStart])}`. Exporta `prisma` de `src/lib/prisma.ts`.
- Decisão: sem tabelas `Player`/`Fixture`; artilharia, assistências, partidas e classificação ficam em `ApiCache` (evita duplicar dados da API sem finalidade).

- [x] **Step 1: Teste falho** `schema.test.ts`: criar `User` com e-mail duplicado lança violação de unicidade; `Season` duplicada (`competitionId`+`year`) lança; `Team` com mesmo `externalId` lança.
- [x] **Step 2:** `npx vitest run --project integration`. Esperado: FAIL.
- [x] **Step 3:** Escrever o schema, `docker compose up -d`, `npx prisma migrate dev --name init`. O setup de integração aplica `prisma migrate deploy` e trunca tabelas entre testes.
- [x] **Step 4:** Rodar o teste. Esperado: PASS.
- [x] **Step 5:** Commit `feat: prisma schema and migrations`.

---

### Task 3: Seleção de temporada

**Files:**

- Create: `src/lib/season.ts`, `tests/unit/season.test.ts`

**Interfaces:**

- Produces: `resolveSeason(args: { override?: number; apiSeasons: { year: number; current: boolean }[] }): number`.

- [x] **Step 1: Teste falho:** com `override: 2024` retorna `2024` ignorando `apiSeasons`; sem override retorna o ano da temporada com `current: true` (ex.: `[{year:2025,current:false},{year:2026,current:true}]` → `2026`, mesmo que o ano civil seja outro); sem override e sem `current` retorna o maior ano; lista vazia sem override lança `Error("season_unavailable")`.
- [x] **Step 2:** Rodar; FAIL. **Step 3:** Implementar. **Step 4:** Rodar; PASS.
- [x] **Step 5:** Commit `feat: season resolution`.

---

### Task 4: Cliente API-Football

**Files:**

- Create: `src/server/api-football/client.ts`, `tests/unit/api-client.test.ts`

**Interfaces:**

- Consumes: `env`, `prisma` (para `ApiUsage`).
- Produces: `apiGet<T>(path: string, params: Record<string, string | number>): Promise<T>` retorna o campo `response` da API; lança `ApiFootballError` com `kind: "rate_limited" | "timeout" | "unavailable" | "bad_response"`.

- [x] **Step 1: Testes falhos** (com `fetch` mockado): envia header `x-apisports-key` e monta a query; `429` lança `rate_limited` sem retry; `503` faz até 3 tentativas com backoff (usar timers falsos) e depois lança `unavailable`; sucesso após uma falha transitória retorna dados; timeout de 8 s lança `timeout`; corpo com `errors` não vazio (a API devolve HTTP 200 com erros, ex.: temporada fora do plano) lança `bad_response` com a mensagem; a chave nunca aparece na mensagem do erro; cada chamada grava `ApiUsage` com o header `x-ratelimit-requests-remaining`.
- [x] **Step 2:** Rodar; FAIL. **Step 3:** Implementar com `fetch` + `AbortController`; backoff exponencial 500 ms/1 s/2 s só para 5xx e erros de rede. **Step 4:** Rodar; PASS.
- [x] **Step 5:** Commit `feat: api-football client with retry and usage log`.

---

### Task 5: Cadastro e autenticação (sem clube ainda)

> Ordem: este task depende de Task 6 (clubes) para o campo de time no formulário. Backend de registro recebe `favoriteTeamId` já como UUID interno; a UI de seleção chega na Task 6.

**Files:**

- Create: `src/modules/auth/{password.ts,register.ts,schemas.ts}`, `src/lib/auth.ts`, `src/server/rate-limit.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/middleware.ts`, `tests/unit/password.test.ts`, `tests/integration/register.test.ts`, `tests/integration/rate-limit.test.ts`
- Rotas `POST /api/auth/login` e `/logout` são atendidas pelo Auth.js (`signIn`/`signOut`); documentar o mapeamento no README.

**Interfaces:**

- Produces: `hashPassword(plain: string): Promise<string>` (Argon2id), `verifyPassword(plain: string, hash: string): Promise<boolean>`; `registerUser(input: { name: string; email: string; password: string; favoriteTeamId: string }): Promise<{ id: string }>` lança `EmailTakenError`, `TeamNotFoundError`; `registerSchema` (Zod): nome 2–80, e-mail válido normalizado para minúsculas, senha ≥ 8 caracteres; `rateLimit(key: string, limit: number, windowSec: number): Promise<{ allowed: boolean }>`; `auth()` do Auth.js; `requireUser(): Promise<{ id: string }>` (redireciona/401 se sem sessão).

- [ ] **Step 1: Testes falhos:** hash começa com `$argon2id$` e `verifyPassword` valida certo/errado; `registerUser` com `A@X.com` e depois `a@x.com` lança `EmailTakenError`; senha de 7 caracteres rejeitada por `registerSchema`; `favoriteTeamId` inexistente lança `TeamNotFoundError`; `passwordHash` salvo ≠ senha; `rateLimit("login:ip", 5, 60)` permite 5 e bloqueia a 6ª; POST `/api/auth/register` com payload inválido retorna `400` com erros Zod e com e-mail repetido retorna `409`.
- [ ] **Step 2:** Rodar; FAIL. **Step 3:** Implementar. Credentials `authorize` aplica `rateLimit` por e-mail e IP. `middleware.ts` protege `/dashboard`, `/competicoes`, `/perfil`. Cookies seguros e `HttpOnly` (padrão do Auth.js; garantir `secure` em produção). **Step 4:** Rodar; PASS.
- [ ] **Step 5:** Commit `feat: registration and credentials auth`.

---

### Task 6: Clubes — sincronização e busca

**Files:**

- Create: `src/server/api-football/teams.ts`, `src/modules/teams/{sync.ts,search.ts}`, `src/app/api/teams/route.ts`, `tests/fixtures/api-football/teams-brazil.json`, `tests/unit/teams-mapper.test.ts`, `tests/integration/teams.test.ts`
- Create (UI): `src/components/teams/TeamPicker.tsx`, `src/app/(auth)/cadastro/page.tsx`, `src/app/(auth)/login/page.tsx`

**Interfaces:**

- Consumes: `apiGet`, `prisma`, `registerUser`.
- Produces: `fetchBrazilianTeams(): Promise<TeamDTO[]>` com `TeamDTO = { externalId: number; name: string; logo: string | null; country: string }`; `syncTeams(): Promise<{ upserted: number }>` (upsert por `externalId`, usa `GET /teams?country=Brazil` com a lista de ligas brasileiras da temporada resolvida; aproveita as páginas de `/leagues` e `/teams?league=&season=` — verificar na documentação o filtro mais barato em chamadas); `searchTeams(q: string, limit = 10): Promise<TeamDTO & { id: string }[]>` consulta só o banco, `ILIKE`, mínimo 2 caracteres; `GET /api/teams?search=`.

- [ ] **Step 1: Testes falhos:** mapper converte a fixture para `TeamDTO` e `logo` ausente vira `null`; `syncTeams` duas vezes não duplica; `searchTeams("flam")` encontra "Flamengo" sem acento/caixa; `q` de 1 caractere retorna `[]`; `GET /api/teams?search=fla` retorna `200` e nunca chama `fetch` externo.
- [ ] **Step 2:** Rodar; FAIL. **Step 3:** Implementar; UI do cadastro com busca por debounce (300 ms) contra `/api/teams`, mostrando escudo e nome, chamando `registerUser` e depois `signIn`. **Step 4:** Rodar; PASS.
- [ ] **Step 5:** Commit `feat: team sync, search and signup flow`.

---

### Task 7: Camada de cache

**Files:**

- Create: `src/server/cache/api-cache.ts`, `src/server/cache/ttl.ts`, `tests/integration/api-cache.test.ts`

**Interfaces:**

- Consumes: `prisma`, `ApiFootballError`.
- Produces: `TTL_SECONDS = { standings: 3 * 3600, topscorers: 6 * 3600, topassists: 6 * 3600, fixtures: 6 * 3600, leagues: 24 * 3600 }` (relaxado frente ao brainstorm por causa do plano gratuito); `getOrFetch<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<{ data: T; fetchedAt: Date; stale: boolean }>`; lança `ApiFootballError` se falhar sem dado salvo.

- [ ] **Step 1: Testes falhos:** primeira chamada executa o fetcher e grava; segunda dentro do TTL não executa o fetcher; após expirar, executa de novo; se o fetcher lança `rate_limited` e há dado vencido, retorna o dado com `stale: true`; sem dado salvo, propaga o erro; duas chamadas concorrentes com a mesma chave executam o fetcher uma única vez (deduplicação em processo); chaves diferentes não se misturam.
- [ ] **Step 2:** Rodar; FAIL. **Step 3:** Implementar. **Step 4:** Rodar; PASS.
- [ ] **Step 5:** Commit `feat: ttl cache with stale fallback`.

---

### Task 8: Competições, classificação, artilharia, assistências, partidas

**Files:**

- Create: `src/server/api-football/{leagues,standings,players,fixtures}.ts`, `src/modules/competitions/{service.ts,types.ts}`, `tests/fixtures/api-football/{leagues-team.json,standings-league.json,standings-cup-empty.json,topscorers.json,topassists-empty.json,fixtures-team.json}`, `tests/unit/competition-mappers.test.ts`, `tests/integration/competition-service.test.ts`

**Interfaces:**

- Consumes: `apiGet`, `getOrFetch`, `TTL_SECONDS`, `resolveSeason`, `prisma`.
- Produces (todos em `service.ts`):
  - `Availability<T> = { status: "ok"; data: T; fetchedAt: Date; stale: boolean } | { status: "unavailable"; reason: "no_coverage" | "provider_error" }`
  - `getTeamCompetitions(teamId: string): Promise<{ season: number; competitions: { id: string; externalId: number; name: string; type: "League" | "Cup" | string }[] }>` (persiste `Competition`/`Season`/`TeamCompetition`)
  - `getStandings(competitionId: string, season: number): Promise<Availability<{ format: "table"; rows: StandingRow[] } | { format: "stages"; stages: { name: string; rows: StandingRow[] }[] }>>`, onde `StandingRow = { rank: number; teamExternalId: number; teamName: string; teamLogo: string | null; points: number; played: number; goalsDiff: number }`
  - `getTopScorers` e `getTopAssists(competitionId, season): Promise<Availability<{ playerExternalId: number; name: string; photo: string | null; team: string; value: number }[]>>`
  - `getTeamFixtures(teamId: string, season: number): Promise<Availability<{ past: FixtureDTO[]; upcoming: FixtureDTO[] }>>`, com `FixtureDTO = { externalId: number; date: string /* ISO UTC */; status: string; competition: string; home: { name: string; logo: string | null; score: number | null }; away: {...} }`

- [ ] **Step 1: Testes falhos:** resposta vazia de `topassists` → `{status:"unavailable", reason:"no_coverage"}` (nunca lista com zero); `standings` de copa vazia ou com vários grupos → `format: "stages"` ou `unavailable`, nunca `table`; liga com um grupo → `format: "table"`; `fixtures` divide `past`/`upcoming` por `date` e `status`; erro de provedor sem cache → `unavailable/provider_error`; com cache vencido → `ok` e `stale: true`; datas permanecem ISO UTC.
- [ ] **Step 2:** Rodar; FAIL. **Step 3:** Implementar mapeadores com schemas Zod (resposta desconhecida → `bad_response`). Competições do clube via `GET /leagues?team=&season=`. Partidas com `GET /fixtures?team=&season=` (uma chamada, dividida localmente; evita `next=5` mais chamadas). **Step 4:** Rodar; PASS.
- [ ] **Step 5:** Commit `feat: competition data services`.

---

### Task 9: Dashboard (serviço, rota e página)

**Files:**

- Create: `src/modules/dashboard/service.ts`, `src/app/api/dashboard/route.ts`, `src/app/(dashboard)/dashboard/page.tsx`, `src/components/dashboard/{ClubHeader,CompetitionCard,NextMatch,Unavailable,LastUpdated}.tsx`, `tests/integration/dashboard.test.ts`

**Interfaces:**

- Consumes: `requireUser`, serviços da Task 8.
- Produces: `getDashboard(userId: string): Promise<{ team: {name: string; logo: string | null}; season: number; competitions: { id: string; name: string; standing: Availability<...>; topScorer: Availability<ScorerDTO>; topAssist: Availability<ScorerDTO> }[]; nextMatch: Availability<FixtureDTO | null> }>`; `GET /api/dashboard` (`401` sem sessão).

- [ ] **Step 1: Testes falhos:** usuário vê só o próprio clube; sem sessão → `401`; competição com assistências indisponíveis mantém `standing` e `topScorer` preenchidos; `nextMatch.data === null` quando não há partida futura; `season` reflete `SEASON_OVERRIDE`.
- [ ] **Step 2:** Rodar; FAIL. **Step 3:** Implementar; página mostra escudo, nome, ano da temporada, cartão por competição, textos "Dado indisponível" e "Sem próxima partida", `LastUpdated` e aviso quando `stale`. Chamadas por competição em `Promise.all`. **Step 4:** Rodar; PASS.
- [ ] **Step 5:** Commit `feat: club dashboard`.

---

### Task 10: Detalhe da competição e rotas REST

**Files:**

- Create: `src/app/api/competitions/[id]/{standings,top-scorers,top-assists}/route.ts`, `src/app/api/teams/[teamId]/{competitions,fixtures}/route.ts`, `src/app/(dashboard)/competicoes/[id]/page.tsx`, `src/components/competitions/{StandingsTable,StagesView,PlayerRanking,FixtureList}.tsx`, `tests/integration/competition-routes.test.ts`

**Interfaces:**

- Consumes: serviços da Task 8, `requireUser`.
- Produces: rotas da seção 7 do brainstorm, todas com `401` sem sessão e `404` para ids inexistentes; resposta no formato `Availability`.

- [ ] **Step 1: Testes falhos:** cada rota `401` sem sessão; `404` para UUID inexistente; `standings` de copa responde `format: "stages"`; página de copa renderiza `StagesView` e não `StandingsTable`.
- [ ] **Step 2:** Rodar; FAIL. **Step 3:** Implementar. Lista de clubes participantes derivada da própria classificação quando disponível. **Step 4:** Rodar; PASS.
- [ ] **Step 5:** Commit `feat: competition detail pages and rest routes`.

---

### Task 11: Atualização agendada

**Files:**

- Create: `src/modules/sync/refresh.ts`, `src/app/api/internal/refresh/route.ts`, `vercel.json`, `tests/integration/refresh.test.ts`

**Interfaces:**

- Consumes: serviços da Task 8, `getOrFetch`, `prisma`.
- Produces: `refreshAll(budget: number): Promise<{ refreshed: number; skipped: number }>`: percorre competições dos clubes favoritados (deduplicadas por competição/temporada), prioriza chaves vencidas mais antigas e para ao atingir `budget` chamadas ou `rate_limited`; `POST /api/internal/refresh` exige `Authorization: Bearer ${CRON_SECRET}`.

- [ ] **Step 1: Testes falhos:** sem header ou com segredo errado → `401` e nenhuma chamada externa nem escrita; 50 usuários do mesmo clube geram o mesmo número de chamadas que 1; respeita `budget` (ex.: 10); para após `rate_limited`; chaves ainda válidas são puladas.
- [ ] **Step 2:** Rodar; FAIL. **Step 3:** Implementar; `vercel.json` com cron a cada 3 h chamando a rota (a Vercel envia `Authorization: Bearer $CRON_SECRET`). `budget` padrão 60 por execução para sobrar cota às leituras sob demanda. **Step 4:** Rodar; PASS.
- [ ] **Step 5:** Commit `feat: scheduled refresh endpoint`.

---

### Task 12: Perfil e recuperação de senha

**Files:**

- Create: `src/modules/users/profile.ts`, `src/modules/auth/reset.ts`, `src/app/api/me/route.ts`, `src/app/api/auth/{forgot,reset}/route.ts`, `src/server/email.ts`, `src/app/(dashboard)/perfil/page.tsx`, `src/app/(auth)/{esqueci-senha,redefinir-senha}/page.tsx`, `tests/integration/profile.test.ts`, `tests/integration/reset.test.ts`

**Interfaces:**

- Consumes: `requireUser`, `hashPassword`, `verifyPassword`, `rateLimit`.
- Produces: `GET /api/me` → `{ id, name, email, favoriteTeam }`; `PATCH /api/me` aceita `{ name?, currentPassword?, newPassword? }` e **ignora/rejeita (**`400`**)** `favoriteTeamId`; `requestPasswordReset(email: string): Promise<void>` (sempre resolve igual, exista ou não o e-mail; token aleatório de 32 bytes, guarda só o hash SHA-256, expira em 1 h); `resetPassword(token: string, newPassword: string): Promise<void>` lança `InvalidTokenError` se expirado, usado ou inexistente; `sendEmail(to, subject, text)` usa Resend, ou loga o link no console sem `RESEND_API_KEY`.

- [ ] **Step 1: Testes falhos:** `PATCH` com `favoriteTeamId` → `400` e time inalterado; trocar senha exige `currentPassword` correta; um usuário não consegue ler/alterar outro; token só funciona uma vez; token expirado falha; `requestPasswordReset` com e-mail inexistente não revela a diferença (mesma resposta, sem e-mail enviado); rate limit em `/forgot`.
- [ ] **Step 2:** Rodar; FAIL. **Step 3:** Implementar. **Step 4:** Rodar; PASS.
- [ ] **Step 5:** Commit `feat: profile and password reset`.

---

### Task 13: E2E

**Files:**

- Create: `playwright.config.ts`, `tests/e2e/{signup-dashboard.spec.ts,auth.spec.ts,competition.spec.ts,profile.spec.ts}`, `tests/e2e/mock-api-server.ts`
- Modify: `.env.test` (`API_FOOTBALL_BASE_URL` apontando para o servidor mock local)

**Interfaces:**

- Consumes: todo o app.
- Produces: servidor mock servindo as fixtures de `tests/fixtures/api-football/`.

- [ ] **Step 1: Specs:** cadastro com busca e seleção do clube → cai no dashboard com o clube correto e o ano de `SEASON_OVERRIDE`; login/logout; rota protegida redireciona para login; página da competição mostra tabela de liga, e uma copa mostra fases; perfil não oferece troca de time; competição sem assistências mostra "indisponível".
- [ ] **Step 2:** `npx playwright test`. Esperado: FAIL antes do mock; **Step 3:** subir o mock e ajustar; **Step 4:** Esperado: PASS.
- [ ] **Step 5:** Commit `test: e2e flows with mocked api`.

---

### Task 14: Publicação e documentação

**Files:**

- Create/Modify: `README.md`, `.github/workflows/ci.yml` (lint, tipos, testes unit/integração com Postgres de serviço, build)

- [ ] **Step 1:** README: setup local, variáveis, como obter a chave, mapeamento de rotas de auth, limites do plano gratuito, como trocar para o plano pago (remover `SEASON_OVERRIDE`, ajustar TTLs e `budget`).
- [ ] **Step 2:** CI verde em PR de teste. Esperado: todos os jobs passam.
- [ ] **Step 3:** Deploy na Vercel + Neon: `prisma migrate deploy`, definir variáveis, `POST /api/internal/refresh` manual com o segredo, conferir dashboard. Checklist de produção: assinar plano pago, remover `SEASON_OVERRIDE`, conferir termos de uso de dados e escudos.
- [ ] **Step 4:** Commit `docs: readme, ci and deploy notes`.

---

## Self-Review

- **Cobertura do spec:** cadastro/login/logout/perfil/reset (T5, T12); dashboard (T9); detalhe da competição (T10); temporada configurável (T3); cache, agendamento, `429`, backoff, consumo (T4, T7, T11); clube por busca local (T6); segurança, rate limit, env (T1, T5); testes unit/integração/E2E (T1–T13); critérios de aceite da seção 14 cobertos por T9, T10, T13. Fora de escopo registrados: ao vivo, funcionalidades futuras.
- **Desvio consciente do brainstorm:** sem tabelas `Player`/`Fixture`; dados voláteis ficam em `ApiCache`. TTLs mais longos que a seção 8 por causa do plano gratuito.
- **Ordem:** T5 cadastra via API; a UI do cadastro depende de T6. Executar T1→T2→T3→T4→T6 (sync/busca)→T5→… é permitido; T5 e T6 podem ser feitos nessa ordem trocada sem alterar interfaces.
- **Consistência de tipos:** `Availability`, `FixtureDTO`, `TeamDTO` e `getOrFetch` são definidos uma vez e reutilizados pelas Tasks 9–11.
