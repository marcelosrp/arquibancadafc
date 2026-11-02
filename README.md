This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Popular a lista de clubes

Com o app rodando e `API_FOOTBALL_KEY` configurada (gasta ~4 chamadas da cota; mais 1 sem `SEASON_OVERRIDE`):

```
curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/internal/sync-teams
```

Depois, `GET /api/teams?search=flam` consulta apenas o banco.

## Autenticação

Auth.js (Credentials, sessão JWT em cookie `HttpOnly`) + senhas com Argon2id. Mapeamento das rotas:

| Contrato | Implementação |
|---|---|
| `POST /api/auth/register` | Route Handler próprio (`201`, `400` com erros Zod, `409` e-mail repetido, `429`) |
| login | `signIn("credentials")` do Auth.js (`POST /api/auth/callback/credentials`) |
| logout | `signOut()` do Auth.js (`POST /api/auth/signout`) |

`/dashboard`, `/competicoes` e `/perfil` são protegidas por `src/proxy.ts` (no Next 16, o antigo `middleware.ts`). Login tem rate limit por e-mail (5 / 15 min) e por IP (20 / 15 min). Gere o `AUTH_SECRET` com `npx auth secret`.
