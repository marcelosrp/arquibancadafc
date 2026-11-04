import { NextResponse } from "next/server";
import { getCompetition, getTopAssists } from "@/modules/competitions/service";
import { withUser } from "@/server/http/route-helpers";

export const GET = withUser(async ({ params, season }) => {
  const competition = await getCompetition(params.id, season);
  return NextResponse.json(await getTopAssists(competition.id, competition.season));
});
