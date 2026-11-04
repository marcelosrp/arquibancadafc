import { NextResponse } from "next/server";
import { getTeamCompetitions, getTeamFixtures } from "@/modules/competitions/service";
import { withUser } from "@/server/http/route-helpers";

export const GET = withUser(async ({ params, season }) => {
  const resolved = season ?? (await getTeamCompetitions(params.teamId)).season;
  return NextResponse.json(await getTeamFixtures(params.teamId, resolved));
});
