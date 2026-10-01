/** Image / PDF questions via the free Gemini tier. Pure helpers: validation, request shape, response parsing, labels. */
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export type AllowedMime = (typeof ALLOWED_MIME)[number];
/** Vercel functions accept ~4.5 MB bodies; base64 adds a third, so raw bytes stay under 3 MB. */
export const MAX_RAW_BYTES = 3 * 1024 * 1024;
export const MAX_QUESTION_CHARS = 1000;
export const isAllowedMime = (m: unknown): m is AllowedMime => typeof m === "string" && (ALLOWED_MIME as readonly string[]).includes(m);

export interface FilePayload { question: string; language: "he" | "en"; mimeType: AllowedMime; data: string }
const B64 = /^[A-Za-z0-9+/]+={0,2}$/;
/** Approximate raw size of a base64 string. */
export const rawBytes = (b64: string): number => Math.floor((b64.length * 3) / 4) - (b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0);

export function normalizeFilePayload(raw: unknown): FilePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!isAllowedMime(r.mimeType) || typeof r.data !== "string" || !r.data || !B64.test(r.data)) return null;
  if (rawBytes(r.data) > MAX_RAW_BYTES) return null;
  const question = (typeof r.question === "string" ? r.question : "").trim().slice(0, MAX_QUESTION_CHARS);
  return { question, language: r.language === "he" ? "he" : "en", mimeType: r.mimeType, data: r.data };
}

export function fileSystemPrompt(language: "he" | "en"): string {
  return [
    "You are InvestED+, an educational assistant. The user attached a file and asked a question about it.",
    "Describe only what is actually visible or written in the file, then answer the question from that.",
    "Do not diagnose any medical condition and do not give personal investment advice. For a health-related image, describe what is visible in general terms, say plainly that you cannot diagnose from a picture, and suggest a qualified professional.",
    "Never invent numbers, names or facts that are not in the file. If something is unclear or unreadable, say so.",
    "Use short, plain sentences. Do not ask for or repeat personal identifiers such as ID numbers or full account numbers.",
    `Reply in ${language === "he" ? "Hebrew" : "English"}.`,
  ].join("\n");
}

export interface GeminiFileRequest {
  systemInstruction: { parts: { text: string }[] };
  contents: { role: "user"; parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] }[];
}
export function buildFileRequest(p: FilePayload): GeminiFileRequest {
  const q = p.question || (p.language === "he" ? "תאר מה בקובץ והסבר בפשטות." : "Describe what is in this file and explain it simply.");
  return {
    systemInstruction: { parts: [{ text: fileSystemPrompt(p.language) }] },
    contents: [{ role: "user", parts: [{ text: q }, { inlineData: { mimeType: p.mimeType, data: p.data } }] }],
  };
}
export function parseFileResponse(body: unknown): string | null {
  const parts = (body as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] } | null)?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts.map((x) => (typeof x?.text === "string" ? x.text : "")).join("").trim();
  return text || null;
}

export const CONSENT_KEY = "invested.fileConsent.v1";
export function hasConsent(store: Pick<Storage, "getItem"> | null = typeof localStorage === "undefined" ? null : localStorage): boolean {
  try { return store?.getItem(CONSENT_KEY) === "yes"; } catch { return false; }
}
export function giveConsent(store: Pick<Storage, "setItem"> | null = typeof localStorage === "undefined" ? null : localStorage): void {
  try { store?.setItem(CONSENT_KEY, "yes"); } catch { /* consent just is not remembered */ }
}
export type UploadProblem = "type" | "size";
export function checkFile(file: { type: string; size: number }): UploadProblem | null {
  if (!isAllowedMime(file.type)) return "type";
  return file.size > 12 * 1024 * 1024 ? "size" : null; // images are shrunk in the browser; PDFs must fit MAX_RAW_BYTES later
}
