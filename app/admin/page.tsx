import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="font-serif text-3xl">Dashboard</h1>
      <ul className="mt-4 space-y-2">
        <li>
          <Link href="/admin/posts" className="text-accent hover:underline">
            Manage posts →
          </Link>
        </li>
        <li>
          <Link href="/admin/places" className="text-accent hover:underline">
            Manage places →
          </Link>
        </li>
        <li>
          <Link href="/admin/products" className="text-accent hover:underline">
            Manage products →
          </Link>
        </li>
      </ul>
    </div>
  );
}
