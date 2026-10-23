export type Lang = "en" | "hi" | "kn";
export const LANG_LABEL: Record<Lang, string> = { en: "English", hi: "हिन्दी", kn: "ಕನ್ನಡ" };

type Out = { ok: true; text: string } | { ok: false; message: string };

async function call(body: unknown): Promise<Out> {
  try {
    const res = await fetch("/api/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || typeof d.text !== "string") return { ok: false, message: d.error ?? "Something went wrong. Please try again." };
    return { ok: true, text: d.text };
  } catch {
    return { ok: false, message: "Network problem. Please try again." };
  }
}

/** Turns what the person wrote, in any language, into a clear English account. */
export const rewriteComplaint = (text: string, issueLabel: string) => call({ mode: "rewrite", text, issueLabel });

/** Explains the result in plain words in the chosen language. Only the result is sent, never personal details. */
export const explainResult = (lang: Lang, parts: { explanation: string; sections: string[]; relief: string[]; steps: string[] }) => call({ mode: "explain", lang, parts });
