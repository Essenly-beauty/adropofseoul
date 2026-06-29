import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-content px-6 py-32 text-center">
      <p className="text-sm uppercase tracking-widest text-accent">404</p>
      <h1 className="mt-2 font-serif text-5xl">Page not found</h1>
      <p className="mt-4 text-text-muted">
        The page you were looking for isn&apos;t here.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-md bg-accent px-5 py-2.5 text-sm text-white hover:bg-accent-hover"
      >
        Back home
      </Link>
    </main>
  );
}
