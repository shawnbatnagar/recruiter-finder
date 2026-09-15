"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { findOrCreateCompany } from "@/app/actions";
import { parseCompanyFromJobUrl } from "@/lib/parse-job-url";

export function SearchBox() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = value.trim();
    if (!trimmed) return;

    const companyName = trimmed.startsWith("http")
      ? parseCompanyFromJobUrl(trimmed) ?? trimmed
      : trimmed;

    startTransition(async () => {
      const result = await findOrCreateCompany(companyName);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/company/${result.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex items-stretch border border-rule bg-paper-dim">
        <span className="hidden items-center border-r border-rule px-4 font-mono text-[11px] tracking-[0.2em] text-ink-soft uppercase sm:flex">
          Lookup
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste a job posting URL, or type a company name"
          className="flex-1 bg-transparent px-4 py-4 font-mono text-sm text-ink placeholder:text-ink-soft/70 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="border-l border-rule px-6 font-mono text-xs tracking-[0.15em] text-ink uppercase transition-colors hover:bg-accent hover:text-paper disabled:opacity-50"
        >
          {isPending ? "…" : "Search"}
        </button>
      </div>
      {error && <p className="font-mono text-xs text-accent">{error}</p>}
    </form>
  );
}
