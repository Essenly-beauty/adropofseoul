"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/validation";

export type NewsletterState = { ok: boolean; message: string };

export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!isValidEmail(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email });
  if (error) {
    // Unique-violation (already subscribed) is a success from the user's view.
    if (error.code === "23505") {
      return { ok: true, message: "You're already on the list — thank you!" };
    }
    return { ok: false, message: "Something went wrong. Please try again." };
  }
  return { ok: true, message: "Thanks for subscribing!" };
}
