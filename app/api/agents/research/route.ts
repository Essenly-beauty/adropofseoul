import { NextResponse } from "next/server";
import { runResearch, productionDeps } from "@/services/agents/research";

// The repo's only API route: Vercel Cron cannot invoke Server Actions, so the
// weekly research run enters here. Gated by CRON_SECRET — never public.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RESEARCH_AREAS = ["Seongsu", "Hannam", "Bukchon", "Yeonnam", "Apgujeong"];

function weekIndex(date: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor(date.getTime() / msPerWeek);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const area = RESEARCH_AREAS[weekIndex(new Date()) % RESEARCH_AREAS.length];
  const result = await runResearch({ area }, productionDeps());

  return NextResponse.json(
    { area, ...result },
    { status: result.ok ? 200 : 500 }
  );
}
