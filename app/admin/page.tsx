import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="font-serif text-3xl">Dashboard</h1>
      <ul className="mt-4 space-y-2">
        <li>
          <Link href="/admin/places" className="text-accent hover:underline">
            Manage places →
          </Link>
        </li>
      </ul>
      <p className="mt-4 text-sm text-text-muted">
        Posts and Products management arrive in a later CMS slice.
      </p>
    </div>
  );
}
