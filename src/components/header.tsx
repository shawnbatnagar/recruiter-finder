import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <Link href="/" className="text-sm font-semibold">
        Recruiter Finder
      </Link>
      {user ? (
        <form action={signOut} className="flex items-center gap-3 text-sm text-gray-500">
          <span>{user.email}</span>
          <button type="submit" className="underline hover:text-gray-900">
            Sign out
          </button>
        </form>
      ) : (
        <Link href="/login" className="text-sm underline hover:text-gray-900">
          Sign in
        </Link>
      )}
    </header>
  );
}
