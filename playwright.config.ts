import { readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
import { parse } from "dotenv";

// Só as variáveis de .env.test — nunca o ambiente inteiro do processo.
const testEnv = parse(readFileSync(".env.test"));
const APP_PORT = 3100;
const MOCK_PORT = 4010;

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.spec.ts",
  globalSetup: "./tests/e2e/global-setup.ts",
  // Um único banco compartilhado: execução serial evita corridas.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: "retain-on-failure",
    locale: "pt-BR",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node tests/e2e/mock-api-server.ts",
      url: `http://localhost:${MOCK_PORT}/health`,
      env: { ...testEnv, MOCK_PORT: String(MOCK_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run build && npm run start -- --port ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}/login`,
      timeout: 300_000,
      env: { ...testEnv, AUTH_TRUST_HOST: "true", AUTH_URL: `http://localhost:${APP_PORT}` },
      reuseExistingServer: !process.env.CI,
    },
  ],
});
