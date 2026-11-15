import { connection } from "next/server";
import { emailMissing } from "@/lib/server/env";
import { geminiConfigured } from "@/lib/server/gemini";
import { json } from "@/lib/server/http";

/** Only booleans: whether the AI and email are set up. Never returns values or variable contents. */
export async function GET() {
  await connection(); // read the environment at request time, not at build time
  return json({ aiConfigured: geminiConfigured(), emailConfigured: emailMissing().length === 0 });
}
