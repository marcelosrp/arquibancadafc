import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { ApiFootballError } from "@/server/api-football/client";
import {
  CompetitionNotFoundError,
  TeamNotFoundError,
} from "@/modules/competitions/service";

const idSchema = z.uuid();
const seasonSchema = z.coerce.number().int().min(1900).max(2200);

type Params = Record<string, string>;

export const notFound = () => NextResponse.json({ error: "not_found" }, { status: 404 });

/**
 * Wraps a handler: 401 without a session, 404 for malformed ids or unknown
 * team/competition, 503 when the provider fails with nothing stored.
 */
export function withUser(
  handler: (args: {
    request: NextRequest;
    params: Params;
    userId: string;
    season: number | undefined;
  }) => Promise<Response>,
) {
  return async (request: NextRequest, ctx: { params: Promise<Params> }) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const params = await ctx.params;
    if (!Object.values(params).every((v) => idSchema.safeParse(v).success)) return notFound();

    const rawSeason = request.nextUrl.searchParams.get("season");
    let season: number | undefined;
    if (rawSeason !== null) {
      const parsed = seasonSchema.safeParse(rawSeason);
      if (!parsed.success) return NextResponse.json({ error: "invalid_season" }, { status: 400 });
      season = parsed.data;
    }

    try {
      return await handler({ request, params, userId: user.id, season });
    } catch (error) {
      if (error instanceof CompetitionNotFoundError || error instanceof TeamNotFoundError) {
        return notFound();
      }
      if (error instanceof ApiFootballError) {
        return NextResponse.json(
          { status: "unavailable", reason: "provider_error" },
          { status: 503 },
        );
      }
      throw error;
    }
  };
}
