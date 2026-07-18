"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/validation";
import { GUIDE_SLUGS } from "@/lib/seongsu/guides";

export type WaitlistState = { ok: boolean; message: string };

// Sources we accept, so a stray/forged `source` can't pollute the metric.
const ALLOWED_SOURCES = new Set<string>([...GUIDE_SLUGS, "seongsu-series"]);

function normalizeSource(raw: string): string {
  const s = raw.trim();
  return ALLOWED_SOURCES.has(s) ? s : "seongsu-series";
}

export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const email = String(formData.get("email") ?? "").trim();
  const source = normalizeSource(String(formData.get("source") ?? ""));

  if (!isValidEmail(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("waitlist_subscribers")
    .insert({ email, source });

  if (error) {
    // Unique-violation (already on this list) is a success from the user's view.
    if (error.code === "23505") {
      return { ok: true, message: "You're already on the list — thank you!" };
    }
    // Table not migrated yet (PGRST205 / 42P01): surface it in logs, don't crash.
    if (error.code === "PGRST205" || error.code === "42P01") {
      console.error(
        "waitlist: waitlist_subscribers missing — run `npm run db:push`",
        error
      );
    } else {
      console.error("waitlist: insert failed", error);
    }
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  // Basic server-side event for the validation metric (source = which post).
  console.info(`waitlist.signup source=${source}`);
  return {
    ok: true,
    message: "You're on the list — we'll be in touch. Thank you!",
  };
}
