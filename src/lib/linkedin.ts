/**
 * Generates LinkedIn people-search deep links as a fallback when no
 * crowdsourced contact exists yet for a company. These just prefill a
 * search query for the user to run in their own logged-in LinkedIn
 * session -- no scraping, no automated fetching of LinkedIn data.
 */

const ROLE_KEYWORDS = [
  "university recruiter",
  "campus recruiter",
  "early careers",
  "talent acquisition",
] as const;

export type LinkedInSearchLink = {
  label: string;
  url: string;
};

export function buildLinkedInSearchLinks(
  companyName: string,
  school?: string,
): LinkedInSearchLink[] {
  return ROLE_KEYWORDS.map((role) => {
    const query = [companyName, role, school].filter(Boolean).join(" ");
    return {
      label: role,
      url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`,
    };
  });
}
