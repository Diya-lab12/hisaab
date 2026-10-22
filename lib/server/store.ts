import { promises as fs } from "node:fs";
import path from "node:path";
import { redis, redisConfigured } from "./env";

export type SubmissionStatus = "submitted" | "approved" | "sent" | "declined";

export type Submission = {
  id: string;
  tokenHash: string; // the client's secret is stored only as a hash
  createdAt: string;
  updatedAt: string;
  status: SubmissionStatus;
  client: { name: string; email: string; contact: string; address: string };
  company: { brand: string; legalName: string; address: string; cin: string; email: string };
  caseRef: string;
  issue: string;
  amount: string;
  date: string;
  resolution: string;
  noticeText: string;
  evidenceCount: number;
  advocateNote: string;
  /** Set when the review is paid for. The client's UPI transaction ID is a claim until the advocate sees the money. */
  payment?: { ref: string; utr: string; total: number; fee: number; items: { id: string; label: string; price: number }[]; verified: boolean };
  /** What the client sees. Written by the system when something really happens. */
  history: { at: string; text: string }[];
};

const KEY = (id: string) => `hisaab:sub:${id}`;
const INDEX = "hisaab:subs";

async function cmd(args: (string | number)[]): Promise<unknown> {
  const res = await fetch(redis.url(), {
    method: "POST",
    headers: { Authorization: `Bearer ${redis.token()}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? `redis ${res.status}`);
  return data.result;
}

const FILE = () => path.join(process.cwd(), ".data", "submissions.json");
async function readFile(): Promise<Record<string, Submission>> {
  try {
    return JSON.parse(await fs.readFile(FILE(), "utf8"));
  } catch {
    return {};
  }
}
async function writeFile(all: Record<string, Submission>) {
  await fs.mkdir(path.dirname(FILE()), { recursive: true });
  await fs.writeFile(FILE(), JSON.stringify(all, null, 2));
}

export async function putSubmission(s: Submission): Promise<void> {
  if (redisConfigured()) {
    await cmd(["SET", KEY(s.id), JSON.stringify(s)]);
    await cmd(["SADD", INDEX, s.id]);
    return;
  }
  const all = await readFile();
  all[s.id] = s;
  await writeFile(all);
}

export async function getSubmission(id: string): Promise<Submission | null> {
  if (!/^[A-Za-z0-9_-]{4,40}$/.test(id)) return null;
  if (redisConfigured()) {
    const raw = (await cmd(["GET", KEY(id)])) as string | null;
    return raw ? (JSON.parse(raw) as Submission) : null;
  }
  return (await readFile())[id] ?? null;
}

export async function listSubmissions(): Promise<Submission[]> {
  let all: Submission[];
  if (redisConfigured()) {
    const ids = ((await cmd(["SMEMBERS", INDEX])) as string[]) ?? [];
    all = (await Promise.all(ids.map((id) => getSubmission(id)))).filter(Boolean) as Submission[];
  } else {
    all = Object.values(await readFile());
  }
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteSubmission(id: string): Promise<void> {
  if (redisConfigured()) {
    await cmd(["DEL", KEY(id)]);
    await cmd(["SREM", INDEX, id]);
    return;
  }
  const all = await readFile();
  delete all[id];
  await writeFile(all);
}
