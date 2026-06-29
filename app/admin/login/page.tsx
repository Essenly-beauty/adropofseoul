import { signIn } from "../actions";

export default function AdminLogin({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error;
  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="font-serif text-3xl">Admin</h1>
      {error === "invalid" && (
        <p className="mt-4 text-sm text-red-600">Invalid email or password.</p>
      )}
      {error === "forbidden" && (
        <p className="mt-4 text-sm text-red-600">
          This account is not an authorized admin.
        </p>
      )}
      <form action={signIn} className="mt-6 space-y-4">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-md border border-soft-gray px-3 py-2"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="w-full rounded-md border border-soft-gray px-3 py-2"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-accent px-4 py-2 text-white hover:bg-accent-hover"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
