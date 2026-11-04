import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { InvalidTokenError, resetPassword } from "@/modules/auth/reset";
import { resetSchema } from "@/modules/auth/schemas";
import { rateLimit } from "@/server/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await rateLimit(`reset:ip:${ip}`, 10, 3600)).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = resetSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    await resetPassword(parsed.data.token, parsed.data.newPassword);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }
    throw error;
  }
}
