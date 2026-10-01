import { MAX_RAW_BYTES, rawBytes, type AllowedMime } from "./fileAnalysis";
export interface PreparedFile { name: string; mimeType: AllowedMime; data: string }
function toBase64(buf: ArrayBuffer): string { let s = ""; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); }
async function shrinkImage(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext("2d")?.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85).split(",")[1] ?? "";
}
/** Reads a file for upload; images are shrunk to JPEG in the browser. Returns null when it cannot fit the size limit. */
export async function prepareFile(file: File): Promise<PreparedFile | null> {
  if (file.type === "application/pdf") { const data = toBase64(await file.arrayBuffer()); return rawBytes(data) > MAX_RAW_BYTES ? null : { name: file.name, mimeType: "application/pdf", data }; }
  const data = await shrinkImage(file);
  return data && rawBytes(data) <= MAX_RAW_BYTES ? { name: file.name, mimeType: "image/jpeg", data } : null;
}
export async function askAboutFile(file: PreparedFile, question: string, language: "he" | "en"): Promise<string | null> {
  try {
    const res = await fetch("/api/describe-file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, language, mimeType: file.mimeType, data: file.data }), signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return null;
    const body = (await res.json()) as { text?: unknown; fallback?: unknown };
    return !body.fallback && typeof body.text === "string" && body.text.trim() ? body.text.trim() : null;
  } catch { return null; }
}
