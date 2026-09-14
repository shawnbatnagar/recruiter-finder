/**
 * Best-effort guess at a company name from a pasted job posting URL, so the
 * search box can prefill something for the user to confirm/edit rather than
 * requiring them to retype the company name by hand. This is a heuristic,
 * not authoritative -- ATS platforms encode the company differently, and
 * some (LinkedIn, Indeed, Glassdoor) don't expose it in the URL at all.
 */

const NON_COMPANY_HOSTS = new Set([
  "linkedin.com",
  "www.linkedin.com",
  "indeed.com",
  "www.indeed.com",
  "glassdoor.com",
  "www.glassdoor.com",
  "ziprecruiter.com",
  "www.ziprecruiter.com",
  "handshake.com",
  "app.joinhandshake.com",
]);

// ATS platforms that put the company as the first path segment,
// e.g. boards.greenhouse.io/acme/jobs/123 -> "acme"
const FIRST_PATH_SEGMENT_HOSTS = [
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "workable.com",
  "smartrecruiters.com",
  "jobvite.com",
];

function titleCase(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function parseCompanyFromJobUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (NON_COMPANY_HOSTS.has(host)) return null;

  // Workday: {company}.wd1.myworkdayjobs.com
  const workdayMatch = host.match(/^([a-z0-9-]+)\.wd\d+\.myworkdayjobs\.com$/);
  if (workdayMatch) return titleCase(workdayMatch[1]);

  // BambooHR: {company}.bamboohr.com
  const bambooMatch = host.match(/^([a-z0-9-]+)\.bamboohr\.com$/);
  if (bambooMatch) return titleCase(bambooMatch[1]);

  for (const atsHost of FIRST_PATH_SEGMENT_HOSTS) {
    if (host === atsHost || host.endsWith(`.${atsHost}`)) {
      const segment = url.pathname.split("/").filter(Boolean)[0];
      return segment ? titleCase(segment) : null;
    }
  }

  // Generic fallback: use the registrable domain's main label, e.g.
  // "careers.acme.com" or "acme.com" -> "Acme". Skips common subdomains
  // that aren't the company name itself.
  const parts = host.split(".");
  if (parts.length < 2) return null;
  const candidates = parts.slice(0, -1).filter((p) => !["www", "careers", "jobs", "apply"].includes(p));
  const label = candidates[candidates.length - 1];
  return label ? titleCase(label) : null;
}
