import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { refreshAll } from "@/modules/sync/refresh";

const DEFAULT_BUDGET = 60;

// Up to 60 sequential provider calls can exceed the default function timeout.
export const maxDuration = 300;

async function handle(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await refreshAll(DEFAULT_BUDGET));
}

export const POST = handle;
// Vercel Cron invokes scheduled routes with GET.
export const GET = handle;
