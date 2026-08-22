import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPECTED_ARTICLE_HASH =
  "695d27a5ca4390a7d8cfa8e276e69bcc5599bfd71d489efea83a2fbb1e5b4071";
const EXPECTED_TOKEN_HASH =
  "04c378ba6926309e75da428b88bf211a601c11973d48f402ff52c942d9b5d87a";

function matchesExpectedToken(request: Request): boolean {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const actual = createHash("sha256").update(token).digest();
  const expected = Buffer.from(EXPECTED_TOKEN_HASH, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function matchesExpectedArticle(article: string): boolean {
  const actual = createHash("sha256").update(article).digest();
  const expected = Buffer.from(EXPECTED_ARTICLE_HASH, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(request: Request) {
  if (!matchesExpectedToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const article = await request.text();
  if (!matchesExpectedArticle(article)) {
    return NextResponse.json(
      { error: "Unexpected article payload" },
      { status: 400 }
    );
  }

  const match = article.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return NextResponse.json(
      { error: "Article body not found" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .upsert(
      {
        title: "Five K-Beauty Serums Worth the Hype",
        slug: "five-k-beauty-serums",
        subtitle:
          "Five viral bottles, five different jobs — and the honest reason each one deserves space in a routine.",
        excerpt:
          "A practical edit of five Korean serums worth the hype, from lightweight hydration and post-breakout care to PDRN glow, peptides, and beginner retinol.",
        body: match[1].trimEnd(),
        category: "beauty",
        tags: ["korean skincare", "serum", "k-beauty", "picks", "review"],
        featured_image: "/images/articles/five-k-beauty-serums.jpg",
        author: "A Drop of Seoul Editorial",
        seo_title: "5 Best Korean Serums Worth the Hype in 2026",
        meta_description:
          "Five Korean serums worth the hype in 2026, chosen for hydration, glow, post-breakout marks, peptides, and beginner retinol — with honest limits.",
        status: "published",
        published_at: "2026-08-22T15:45:00+09:00",
      },
      { onConflict: "slug" }
    )
    .select("slug,status,featured_image")
    .single();

  if (error) {
    console.error("one-time serum article publish failed", error.code);
    return NextResponse.json({ error: "Publish failed" }, { status: 500 });
  }

  revalidatePath("/articles/five-k-beauty-serums");
  revalidatePath("/", "layout");

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
