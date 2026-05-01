import { NextResponse } from "next/server";
import { syncRegulationReleasesFromSources } from "@/lib/regulation-updates";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const bearer = request.headers.get("authorization") ?? "";
  if (bearer === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  return Boolean(querySecret && querySecret === secret);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncRegulationReleasesFromSources();
  const ok = result.errors.length === 0;
  return NextResponse.json({ ok, ...result }, { status: ok ? 200 : 207 });
}
