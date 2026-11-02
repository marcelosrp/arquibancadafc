import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { searchTeams } from "@/modules/teams/search";

const querySchema = z.string().max(50);

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(request.nextUrl.searchParams.get("search") ?? "");
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_search" }, { status: 400 });
  }
  return NextResponse.json({ teams: await searchTeams(parsed.data) });
}
