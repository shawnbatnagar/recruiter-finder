import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-rule px-6 py-5 sm:px-10">
      <div className="mx-auto flex max-w-4xl items-baseline justify-between">
        <Link
          href="/"
          className="font-mono text-xs font-medium tracking-[0.25em] text-ink uppercase"
        >
          Recruiter&nbsp;Finder
        </Link>
        {user ? (
          <form action={signOut} className="flex items-baseline gap-4 font-mono text-xs text-ink-soft">
            <span className="hidden sm:inline">{user.email}</span>
            <button type="submit" className="underline decoration-rule underline-offset-4 hover:text-accent">
              sign out
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="font-mono text-xs text-ink-soft underline decoration-rule underline-offset-4 hover:text-accent"
          >
            sign in
          </Link>
        )}
      </div>
    </header>
  );
}
