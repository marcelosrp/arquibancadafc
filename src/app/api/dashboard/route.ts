import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDashboard } from "@/modules/dashboard/service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await getDashboard(user.id));
}
