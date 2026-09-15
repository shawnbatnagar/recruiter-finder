import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLinkedInSearchLinks } from "@/lib/linkedin";
import { voteContact, flagContact, requestCompanyContact } from "@/app/actions";
import { ContactForm } from "./contact-form";
import type { ContactWithScore } from "@/lib/types";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: company }, { data: contacts }] = await Promise.all([
    supabase.from("companies").select("id, name, domain").eq("id", id).maybeSingle(),
    supabase
      .from("contacts_with_score")
      .select("*")
      .eq("company_id", id)
      .order("score", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<ContactWithScore[]>(),
  ]);

  if (!company) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const contactIds = (contacts ?? []).map((c) => c.id);

  const [{ data: myVotes }, { data: myFlags }, { data: myRequest }] = await Promise.all([
    user && contactIds.length
      ? supabase.from("contact_votes").select("contact_id, value").in("contact_id", contactIds).eq("user_id", user.id)
      : Promise.resolve({ data: [] as { contact_id: string; value: number }[] }),
    user && contactIds.length
      ? supabase.from("contact_flags").select("contact_id").in("contact_id", contactIds).eq("user_id", user.id)
      : Promise.resolve({ data: [] as { contact_id: string }[] }),
    user
      ? supabase.from("company_requests").select("id").eq("company_id", id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const voteByContact = new Map((myVotes ?? []).map((v) => [v.contact_id, v.value]));
  const flaggedContacts = new Set((myFlags ?? []).map((f) => f.contact_id));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16 sm:px-10">
      <p className="font-mono text-xs tracking-[0.2em] text-ink-soft uppercase">Record</p>
      <h1 className="mt-2 text-4xl font-medium">{company.name}</h1>
      <p className="mt-2 font-mono text-xs text-ink-soft">
        {company.domain ? `${company.domain} — ` : ""}
        {contacts?.length ?? 0} contact{contacts?.length === 1 ? "" : "s"} on file
      </p>

      <section className="mt-12 border-t border-rule">
        {contacts && contacts.length > 0 ? (
          <ol className="divide-y divide-rule">
            {contacts.map((contact, i) => (
              <li key={contact.id} className="grid grid-cols-[2.5rem_1fr] gap-4 py-6">
                <span className="font-mono text-xs text-ink-soft">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-lg">{contact.name}</span>
                    {contact.role_title && (
                      <span className="font-mono text-[11px] text-ink-soft uppercase">
                        {contact.role_title}
                      </span>
                    )}
                  </div>
                  {contact.job_title && (
                    <p className="mt-1 font-mono text-xs text-ink-soft">
                      for: {contact.job_title}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-4 font-mono text-xs">
                    {contact.linkedin_url && (
                      <a
                        href={contact.linkedin_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-accent underline decoration-rule underline-offset-4 hover:decoration-accent"
                      >
                        LinkedIn ↗
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-accent underline decoration-rule underline-offset-4 hover:decoration-accent"
                      >
                        {contact.email}
                      </a>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                      {user ? (
                        <>
                          <form action={voteContact.bind(null, contact.id, id, 1)}>
                            <button
                              className={
                                voteByContact.get(contact.id) === 1
                                  ? "text-positive"
                                  : "text-ink-soft hover:text-ink"
                              }
                              aria-label="Upvote"
                            >
                              ▲
                            </button>
                          </form>
                          <span className="w-5 text-center">{contact.score}</span>
                          <form action={voteContact.bind(null, contact.id, id, -1)}>
                            <button
                              className={
                                voteByContact.get(contact.id) === -1
                                  ? "text-accent"
                                  : "text-ink-soft hover:text-ink"
                              }
                              aria-label="Downvote"
                            >
                              ▼
                            </button>
                          </form>
                        </>
                      ) : (
                        <span className="text-ink-soft">score {contact.score}</span>
                      )}
                    </div>
                  </div>

                  {user &&
                    (flaggedContacts.has(contact.id) ? (
                      <p className="mt-2 font-mono text-[11px] text-ink-soft">flagged</p>
                    ) : (
                      <details className="mt-2">
                        <summary className="cursor-pointer font-mono text-[11px] text-ink-soft hover:text-accent">
                          flag as outdated
                        </summary>
                        <form
                          action={flagContact.bind(null, contact.id, id)}
                          className="mt-2 flex gap-2"
                        >
                          <input
                            name="reason"
                            placeholder="why? (optional)"
                            className="flex-1 border border-rule bg-transparent px-2 py-1 font-mono text-[11px] focus:outline-none focus:border-accent"
                          />
                          <button className="border border-rule px-3 font-mono text-[11px] uppercase hover:bg-accent hover:text-paper hover:border-accent">
                            submit
                          </button>
                        </form>
                      </details>
                    ))}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <NoContactYet companyName={company.name} companyId={id} hasRequested={!!myRequest} isSignedIn={!!user} />
        )}
      </section>

      <section className="mt-16 border-t border-rule pt-10">
        <p className="font-mono text-xs tracking-[0.2em] text-ink-soft uppercase">
          Add to the index
        </p>
        <h2 className="mt-2 text-xl font-medium">Know a contact for {company.name}?</h2>
        {user ? (
          <div className="mt-6">
            <ContactForm companyId={id} />
          </div>
        ) : (
          <p className="mt-4 font-mono text-xs text-ink-soft">
            <Link href="/login" className="text-accent underline decoration-rule underline-offset-4">
              Sign in
            </Link>{" "}
            to add a contact.
          </p>
        )}
      </section>
    </main>
  );
}

function NoContactYet({
  companyName,
  companyId,
  hasRequested,
  isSignedIn,
}: {
  companyName: string;
  companyId: string;
  hasRequested: boolean;
  isSignedIn: boolean;
}) {
  const links = buildLinkedInSearchLinks(companyName);
  return (
    <div className="border border-dashed border-rule px-6 py-8">
      <p className="font-mono text-xs tracking-[0.15em] text-ink-soft uppercase">
        No contact on file yet
      </p>
      <p className="mt-2 max-w-lg text-sm text-ink-soft">
        Nobody has added a recruiter for {companyName}. Try one of these
        searches on your own LinkedIn, and add what you find below.
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer noopener"
              className="font-mono text-xs text-accent underline decoration-rule underline-offset-4 hover:decoration-accent"
            >
              → search &ldquo;{link.label}&rdquo; at {companyName}
            </a>
          </li>
        ))}
      </ul>

      {isSignedIn && (
        <form action={requestCompanyContact.bind(null, companyId)} className="mt-6">
          <button
            disabled={hasRequested}
            className="border border-rule px-4 py-2 font-mono text-[11px] tracking-[0.1em] uppercase text-ink-soft hover:bg-accent hover:text-paper hover:border-accent disabled:opacity-50"
          >
            {hasRequested ? "Marked as needed" : "Mark as needed"}
          </button>
        </form>
      )}
    </div>
  );
}
