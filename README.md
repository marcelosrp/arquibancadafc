# Arquibancada

Dashboard personalizado do clube favorito: competições, classificação, artilheiro, líder de assistências e próxima partida, alimentado pela [API-Football](https://www.api-football.com/) com cache compartilhado em PostgreSQL.

Stack: Next.js (App Router), TypeScript, Tailwind, Prisma + PostgreSQL, Auth.js (Credentials/JWT), Zod, Vitest, Playwright.

## Setup local

Requisitos: Node 24+, Docker.

```bash
npm install
cp .env.example .env          # preencha as variáveis (veja abaixo)
npm run db:up                 # Postgres local na porta 5433 (cria também arquibancada_test)
npx prisma migrate deploy     # aplica as migrações
npm run dev
```

Popule os clubes (necessário para o cadastro) com a rota interna:

```bash
curl -X POST http://localhost:3000/api/internal/sync-teams -H "Authorization: Bearer $CRON_SECRET"
```

### Variáveis de ambiente

Validadas com Zod na inicialização (`src/lib/env.ts`).

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim | Conexão PostgreSQL |
| `API_FOOTBALL_BASE_URL` | não | Padrão `https://v3.football.api-sports.io` |
| `API_FOOTBALL_KEY` | sim | Chave da API-Football (só servidor; nunca `NEXT_PUBLIC_*`) |
| `AUTH_SECRET` | sim | Gere com `npx auth secret` |
| `CRON_SECRET` | sim | Segredo das rotas `/api/internal/*` |
| `SEASON_OVERRIDE` | não | Força a temporada (plano gratuito: 2022–2024; em dev use `2024`) |
| `RESEND_API_KEY` | não | Envio de e-mail; sem ela o link de redefinição é logado no console |

### Como obter a chave da API-Football

Crie uma conta em <https://dashboard.api-football.com/register>, copie a chave do painel e coloque em `API_FOOTBALL_KEY`.

## Testes

```bash
npm run test:unit
npm run test:integration   # exige o Postgres do docker-compose
npm run test:e2e           # Playwright, com servidor mock da API-Football
```

Todos os testes usam respostas mockadas (`tests/fixtures/api-football/`); nenhum consome a cota da API real.

## Rotas de autenticação

O Auth.js atende login e logout; não há route handlers próprios para eles.

| Contrato | Implementação |
|---|---|
| `POST /api/auth/register` | Route handler próprio |
| Login | `signIn("credentials", …)` → `POST /api/auth/callback/credentials` |
| Logout | `signOut()` → `POST /api/auth/signout` |
| Sessão | `GET /api/auth/session` |
| `POST /api/auth/forgot`, `POST /api/auth/reset` | Route handlers próprios |

## Limites do plano gratuito

- 100 requisições/dia e ~10/minuto; temporadas 2022–2024 apenas.
- O navegador nunca chama a API: toda leitura passa por `ApiCache` (TTL de 3 h a 24 h) e, quando a API falha ou responde `429`, o último dado salvo é servido com aviso de desatualizado.
- `POST /api/internal/refresh` (cron a cada 3 h via `vercel.json`) atualiza as chaves vencidas com `budget` padrão de 60 chamadas por execução, deduplicado por competição/temporada.
- Em 2024 nenhum clube tem próxima partida; a UI mostra "Sem próxima partida".

## Migrar para o plano pago

1. Assine um plano pago e atualize `API_FOOTBALL_KEY`.
2. Remova `SEASON_OVERRIDE` (a temporada `current` da API passa a valer).
3. Reduza os TTLs em `src/server/cache/ttl.ts` e aumente o `budget` do refresh conforme a nova cota.
4. Ajuste a frequência do cron em `vercel.json`.

## Deploy (Vercel + Neon)

1. Crie o banco no Neon e copie a connection string para `DATABASE_URL` (Vercel).
2. Defina as variáveis da tabela acima na Vercel (`AUTH_SECRET` e `CRON_SECRET` novos, aleatórios).
3. Aplique as migrações: `DATABASE_URL=<neon> npx prisma migrate deploy`.
4. Faça o deploy e rode `POST /api/internal/sync-teams` e `POST /api/internal/refresh` uma vez, com `Authorization: Bearer $CRON_SECRET`.
5. Confira o cadastro e o dashboard.

Checklist de produção: assinar plano pago, remover `SEASON_OVERRIDE`, conferir os termos de uso de dados e escudos da API-Football.
