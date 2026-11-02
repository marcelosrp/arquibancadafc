export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { parseEnv } = await import("@/lib/env");
    // Fail fast at server startup when the environment is invalid.
    parseEnv(process.env);
  }
}
