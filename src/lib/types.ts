export type Company = {
  id: string;
  name: string;
  domain: string | null;
  created_at: string;
};

export type Contact = {
  id: string;
  company_id: string;
  name: string;
  role_title: string | null;
  linkedin_url: string | null;
  email: string | null;
  job_title: string | null;
  submitted_by: string | null;
  created_at: string;
  last_confirmed_at: string;
};

export type ContactWithScore = Contact & {
  score: number;
};
