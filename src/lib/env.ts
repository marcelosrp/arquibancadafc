import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const envSchema = z.object({
  DATABASE_URL: z.url(),
  API_FOOTBALL_BASE_URL: z.url().default("https://v3.football.api-sports.io"),
  API_FOOTBALL_KEY: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  SEASON_OVERRIDE: z.preprocess(emptyToUndefined, z.coerce.number().int().optional()),
  RESEND_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates raw environment variables. On failure, the error lists only the
 * variable names and validation messages — never the provided values.
 */
export function parseEnv(raw: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment variables: ${issues}`);
  }
  return result.data;
}

let cached: Env | undefined;

/**
 * Validated environment, parsed lazily on first access so that importing this
 * module (tests, `next build`) does not require every variable to be set.
 * Startup validation happens in `src/instrumentation.ts`.
 */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop) {
    cached ??= parseEnv(process.env);
    return cached[prop as keyof Env];
  },
});
