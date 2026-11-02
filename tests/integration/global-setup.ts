import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parse } from "dotenv";

// globalSetup runs in the main process, where vitest's `test.env` is not
// applied (it only reaches the workers), so read .env.test directly.
export default function globalSetup() {
  const { DATABASE_URL: url } = parse(readFileSync(".env.test"));
  if (!url?.includes("_test")) {
    throw new Error(
      "Integration tests must run against a *_test database (check .env.test).",
    );
  }
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
