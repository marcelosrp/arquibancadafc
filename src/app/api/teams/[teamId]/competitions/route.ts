import { NextResponse } from "next/server";
import { getTeamCompetitions } from "@/modules/competitions/service";
import { withUser } from "@/server/http/route-helpers";

export const GET = withUser(async ({ params }) => {
  return NextResponse.json(await getTeamCompetitions(params.teamId));
});
