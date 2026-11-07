import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import pg from "pg";

/** Banco limpo + clubes sincronizados a partir do servidor mock (via rota interna do app). */
export default async function globalSetup() {
  const env = parse(readFileSync(".env.test"));
  if (!env.DATABASE_URL?.includes("_test")) {
    throw new Error("E2E deve rodar contra um banco *_test (verifique .env.test).");
  }
  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'",
    );
    if (rows.length > 0) {
      const list = rows.map((r) => `"public"."${r.tablename}"`).join(", ");
      await client.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
    }
  } finally {
    await client.end();
  }

  const res = await fetch("http://localhost:3100/api/internal/sync-teams", {
    method: "POST",
    headers: { authorization: `Bearer ${env.CRON_SECRET}` },
  });
  if (!res.ok) throw new Error(`sync-teams falhou: ${res.status}`);
}
