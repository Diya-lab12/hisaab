import data from "./companies.json";

export type Company = {
  brand: string;
  aliases?: string[];
  legalName: string | null;
  registeredOffice: string | null;
  grievanceEmail: string | null;
  /** Pages the details were read from, and when. Nothing here is filled in from memory. */
  sources?: string[];
  checkedOn?: string;
};

// TODO: extend this table. Add a brand only with details read from the company's own Terms, Contact or
// Grievance page, with the page URL in `sources`. Leave a field null if it can't be confirmed: the notice
// then says "the advocate will confirm". A wrong address on a legal notice is worse than a blank one.
const COMPANIES = (data as { companies: Company[] }).companies;

const clean = (s: string) =>
  s.toLowerCase().replace(/\.(com|in|co\.in)\b/g, "").replace(/\b(pvt|private|ltd|limited|india|app|the)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** Finds a brand from the name the person gave. Returns null when there is no confident match. */
export function lookupCompany(name: string): Company | null {
  const q = clean(name);
  if (q.length < 3) return null;
  for (const c of COMPANIES) {
    const names = [c.brand, ...(c.aliases ?? [])].map(clean);
    if (names.some((n) => n === q)) return c;
  }
  return null;
}
