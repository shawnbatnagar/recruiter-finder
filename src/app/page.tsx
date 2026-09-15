import { SearchBox } from "@/app/search-box";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-16 px-6 py-16 sm:px-10 sm:py-24">
      <div className="grid gap-10 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="max-w-xl">
          <p className="mb-3 font-mono text-xs tracking-[0.2em] text-ink-soft uppercase">
            No. 001 — Campus &amp; new-grad recruiting
          </p>
          <h1 className="text-4xl leading-[1.1] font-medium sm:text-5xl">
            Find the person behind the job posting.
          </h1>
          <p className="mt-5 text-lg text-ink-soft">
            Every application goes into the same black box. This is a running
            index of who actually reads it — built by applicants, for
            applicants.
          </p>
        </div>
      </div>

      <SearchBox />

      <div className="grid gap-10 border-t border-rule pt-10 sm:grid-cols-3">
        <HowStep n="01" title="Search a company">
          Paste the job link you&rsquo;re applying to, or just type the
          company name.
        </HowStep>
        <HowStep n="02" title="See who&rsquo;s listed">
          Recruiter contacts other applicants have already found, ranked by
          the community.
        </HowStep>
        <HowStep n="03" title="Nothing yet? Search LinkedIn">
          We hand you a pre-built search for that company&rsquo;s recruiters
          — then you can add what you find back to the index.
        </HowStep>
      </div>

      <aside className="border border-rule bg-paper-dim px-6 py-5">
        <p className="font-mono text-[11px] tracking-[0.15em] text-ink-soft uppercase">
          A note on sourcing
        </p>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          This index is built entirely from what applicants submit and
          confirm themselves — names, LinkedIn links, and outreach that
          people already found by hand. Nothing here is scraped from
          LinkedIn or any other platform; where the index is empty, we
          link out to a search you run yourself, logged into your own
          account.
        </p>
      </aside>
    </main>
  );
}

function HowStep({
  n,
  title,
  children,
}: {
  n: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-mono text-xs text-accent">{n}</p>
      <h2 className="mt-1 text-base font-medium">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{children}</p>
    </div>
  );
}
