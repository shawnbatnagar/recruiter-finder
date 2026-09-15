"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { error: null };

/**
 * Looks up a company by (case-insensitive) name, creating it if it doesn't
 * exist yet, and returns its id. Used by the homepage search box so a
 * lookup for a company nobody has added yet still lands somewhere useful.
 */
export async function findOrCreateCompany(
  name: string,
): Promise<{ id: string; error: null } | { id: null; error: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { id: null, error: "Company name is required." };

  const supabase = await createClient();

  const { data: existing, error: lookupError } = await supabase
    .from("companies")
    .select("id")
    .ilike("name", trimmed)
    .maybeSingle();

  if (lookupError) return { id: null, error: lookupError.message };
  if (existing) return { id: existing.id, error: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { id: null, error: "Sign in to add a new company." };
  }

  const { data: created, error: insertError } = await supabase
    .from("companies")
    .insert({ name: trimmed })
    .select("id")
    .single();

  if (insertError) return { id: null, error: insertError.message };
  return { id: created.id, error: null };
}

export async function submitContact(
  companyId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to submit a contact." };

  const name = String(formData.get("name") ?? "").trim();
  const roleTitle = String(formData.get("role_title") ?? "").trim() || null;
  const linkedinUrl = String(formData.get("linkedin_url") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const jobTitle = String(formData.get("job_title") ?? "").trim() || null;

  if (!name) return { error: "Recruiter name is required." };
  if (!linkedinUrl && !email) {
    return { error: "Provide a LinkedIn URL or an email so people can actually reach out." };
  }

  const { error } = await supabase.from("contacts").insert({
    company_id: companyId,
    name,
    role_title: roleTitle,
    linkedin_url: linkedinUrl,
    email,
    job_title: jobTitle,
    submitted_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/company/${companyId}`);
  return { error: null };
}

// These three are only rendered as forms once the page has already
// confirmed the user is signed in, so failures here are rare (an expired
// session, or RLS rejecting a malformed id). They're used directly as
// bound <form action> handlers, which requires a void-returning signature,
// so on failure we just leave state unchanged rather than surfacing an
// error UI for what should be a one-click interaction.

export async function voteContact(
  contactId: string,
  companyId: string,
  value: 1 | -1,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("contact_votes")
    .upsert(
      { contact_id: contactId, user_id: user.id, value },
      { onConflict: "contact_id,user_id" },
    );

  revalidatePath(`/company/${companyId}`);
}

export async function flagContact(
  contactId: string,
  companyId: string,
  formData: FormData,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const reason = String(formData.get("reason") ?? "").trim() || null;

  await supabase
    .from("contact_flags")
    .upsert(
      { contact_id: contactId, user_id: user.id, reason },
      { onConflict: "contact_id,user_id" },
    );

  revalidatePath(`/company/${companyId}`);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestCompanyContact(companyId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("company_requests")
    .upsert(
      { company_id: companyId, user_id: user.id },
      { onConflict: "company_id,user_id" },
    );

  revalidatePath(`/company/${companyId}`);
}
