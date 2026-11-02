import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { EmailTakenError, registerUser, TeamNotFoundError } from "@/modules/auth/register";
import { registerSchema } from "@/modules/auth/schemas";
import { rateLimit } from "@/server/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await rateLimit(`register:ip:${ip}`, 10, 3600)).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const { id } = await registerUser(parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    if (error instanceof TeamNotFoundError) {
      return NextResponse.json(
        { error: "validation", issues: { formErrors: [], fieldErrors: { favoriteTeamId: ["team_not_found"] } } },
        { status: 400 },
      );
    }
    throw error;
  }
}
