"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitContact } from "@/app/actions";

type FormState = { error: string | null; success: boolean };

export function ContactForm({ companyId }: { companyId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const result = await submitContact(companyId, formData);
      return { error: result.error, success: !result.error };
    },
    { error: null, success: false },
  );

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-2">
      <Field label="Recruiter name" name="name" required />
      <Field label="Their role" name="role_title" placeholder="University Recruiter" />
      <Field label="LinkedIn URL" name="linkedin_url" placeholder="linkedin.com/in/…" />
      <Field label="Email" name="email" placeholder="optional if LinkedIn is set" />
      <Field
        label="Job posting title"
        name="job_title"
        placeholder="Software Engineer, New Grad"
        className="sm:col-span-2"
      />

      <div className="flex items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={isPending}
          className="border border-ink bg-ink px-6 py-3 font-mono text-xs tracking-[0.15em] text-paper uppercase transition-colors hover:bg-accent hover:border-accent disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add to index"}
        </button>
        {state.success && (
          <span className="font-mono text-xs text-positive">Added — thank you.</span>
        )}
        {state.error && <span className="font-mono text-xs text-accent">{state.error}</span>}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
        {label}
      </span>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="border border-rule bg-transparent px-3 py-2 font-mono text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent"
      />
    </label>
  );
}
