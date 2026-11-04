import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  getProfile,
  InvalidCurrentPasswordError,
  updateProfile,
  updateProfileSchema,
} from "@/modules/users/profile";
import { rateLimit } from "@/server/rate-limit";

const unauthorized = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return NextResponse.json(await getProfile(user.id));
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const parsed = updateProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  if (parsed.data.newPassword !== undefined) {
    // Stops a hijacked session from brute-forcing the current password.
    if (!(await rateLimit(`pwchange:user:${user.id}`, 5, 15 * 60)).allowed) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
  }

  try {
    return NextResponse.json(await updateProfile(user.id, parsed.data));
  } catch (error) {
    if (error instanceof InvalidCurrentPasswordError) {
      return NextResponse.json({ error: "invalid_current_password" }, { status: 400 });
    }
    throw error;
  }
}
