import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export type ApiFootballErrorKind = "rate_limited" | "timeout" | "unavailable" | "bad_response";

export class ApiFootballError extends Error {
  readonly kind: ApiFootballErrorKind;
  readonly status?: number;

  constructor(kind: ApiFootballErrorKind, message: string, status?: number) {
    super(scrub(message));
    this.name = "ApiFootballError";
    this.kind = kind;
    this.status = status;
  }
}

const TIMEOUT_MS = 8_000;
const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 500;

/** Removes the API key from any text that may end up in an error or log. */
function scrub(text: string): string {
  const key = env.API_FOOTBALL_KEY;
  return key ? text.split(key).join("[redacted]") : text;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function logUsage(endpoint: string, status: number, res?: Response) {
  const remaining = Number.parseInt(res?.headers.get("x-ratelimit-requests-remaining") ?? "", 10);
  try {
    await prisma.apiUsage.create({
      data: {
        endpoint,
        status,
        remainingDay: Number.isNaN(remaining) ? null : remaining,
      },
    });
  } catch {
    // Usage logging must never break a data request.
  }
}

function formatErrors(errors: unknown): string {
  if (Array.isArray(errors)) return errors.map(String).join("; ");
  if (errors && typeof errors === "object") {
    return Object.entries(errors)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join("; ");
  }
  return String(errors);
}

function hasErrors(errors: unknown): boolean {
  if (Array.isArray(errors)) return errors.length > 0;
  if (errors && typeof errors === "object") return Object.keys(errors).length > 0;
  return Boolean(errors);
}

/**
 * GET against API-Football. Returns the `response` field of the payload.
 * Retries 5xx/network failures with exponential backoff; 429 and timeouts
 * fail immediately to preserve the daily quota.
 */
export async function apiGet<T>(
  path: string,
  params: Record<string, string | number>,
): Promise<T> {
  const url = new URL(path, env.API_FOOTBALL_BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "x-apisports-key": env.API_FOOTBALL_KEY },
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timer);
      if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
        await logUsage(path, 0);
        throw new ApiFootballError("timeout", `Request to ${path} timed out`);
      }
      await logUsage(path, 0);
      if (attempt < MAX_ATTEMPTS) {
        await sleep(BACKOFF_BASE_MS * 2 ** (attempt - 1));
        continue;
      }
      throw new ApiFootballError("unavailable", `Network error calling ${path}`);
    }

    try {
      await logUsage(path, res.status, res);

      if (res.status === 429) {
        throw new ApiFootballError("rate_limited", `Rate limited calling ${path}`, 429);
      }
      if (res.status >= 500) {
        if (attempt < MAX_ATTEMPTS) {
          clearTimeout(timer);
          await sleep(BACKOFF_BASE_MS * 2 ** (attempt - 1));
          continue;
        }
        throw new ApiFootballError("unavailable", `API unavailable (${res.status})`, res.status);
      }
      if (!res.ok) {
        throw new ApiFootballError("bad_response", `Unexpected status ${res.status}`, res.status);
      }

      let body: { errors?: unknown; response?: unknown };
      try {
        body = await res.json();
      } catch {
        if (controller.signal.aborted) {
          throw new ApiFootballError("timeout", `Request to ${path} timed out`);
        }
        throw new ApiFootballError("bad_response", `Invalid JSON from ${path}`, res.status);
      }
      if (hasErrors(body?.errors)) {
        throw new ApiFootballError("bad_response", formatErrors(body.errors), res.status);
      }
      if (body?.response === undefined) {
        throw new ApiFootballError("bad_response", `Missing response field from ${path}`, res.status);
      }
      return body.response as T;
    } finally {
      clearTimeout(timer);
    }
  }

  // Unreachable: the loop always returns or throws.
  throw new ApiFootballError("unavailable", `API unavailable calling ${path}`);
}
