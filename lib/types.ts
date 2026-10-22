export type Result = {
  status: "covered" | "not_covered" | "need_more_info";
  source?: "ai" | "rules" | "precheck";
  removedCitations?: number;
  missing?: string[];
  explanation?: string;
  sections?: { id: string; why: string }[];
  relief?: string[];
  steps?: string[];
  filing?: { forum: string; fee: string | null };
  notice?: string;
  not_covered_reason?: string;
  alternatives?: string[];
  industry?: { id: string; label: string };
  evidence?: string[];
  tips?: string[];
};
