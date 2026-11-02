import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { syncTeams } from "@/modules/teams/sync";
import { ApiFootballError } from "@/server/api-football/client";

export async function POST(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await syncTeams());
  } catch (error) {
    if (error instanceof ApiFootballError) {
      return NextResponse.json({ error: "provider_error", kind: error.kind }, { status: 503 });
    }
    throw error;
  }
}
