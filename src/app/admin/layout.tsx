import Link from "next/link";

import { requireAdminUser } from "@/lib/auth-context";

export const metadata = {
  title: "Admin — Daily Game Scores",
};

/**
 * Every page under /admin is gated here. `requireAdminUser` also refuses while
 * impersonating, so there is no route into the admin area from inside a
 * borrowed session.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdminUser();

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold">Admin</h1>
          <p className="text-sm text-default-500">Signed in as {user.email}</p>
        </div>
        <nav className="flex gap-3 text-sm">
          <Link href="/admin" className="underline">
            Overview
          </Link>
          <Link href="/" className="underline">
            Back to app
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
