import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/modules/auth/reset";
import { forgotSchema } from "@/modules/auth/schemas";
import { rateLimit } from "@/server/rate-limit";

const HOUR = 3600;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await rateLimit(`forgot:ip:${ip}`, 5, HOUR)).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = forgotSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  // The per-address cap stops inbox flooding; the response never reveals it,
  // nor whether the address exists.
  if ((await rateLimit(`forgot:email:${parsed.data.email}`, 3, HOUR)).allowed) {
    await requestPasswordReset(parsed.data.email);
  }
  return NextResponse.json({ ok: true });
}
