import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/auth";
import { signOut } from "./actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The login route renders without the gate; everything else requires an
  // allowlisted admin. Middleware already redirects anon users, but we
  // re-check here so a logged-in non-admin can never see admin content.
  const allowed = isAllowedAdmin(user?.email);

  if (user && !allowed) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=forbidden");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-soft-gray px-6 py-4">
        <span className="font-serif text-xl">A Drop of Seoul · Admin</span>
        <form action={signOut}>
          <button className="text-sm text-text-muted hover:text-text">
            Sign out
          </button>
        </form>
      </header>
      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
        <nav aria-label="Admin" className="w-40 shrink-0">
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/admin" className="text-text-muted hover:text-text">
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/admin/posts"
                className="text-text-muted hover:text-text"
              >
                Posts
              </Link>
            </li>
            <li>
              <Link
                href="/admin/places"
                className="text-text-muted hover:text-text"
              >
                Places
              </Link>
            </li>
            <li>
              <Link
                href="/admin/products"
                className="text-text-muted hover:text-text"
              >
                Products
              </Link>
            </li>
          </ul>
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
