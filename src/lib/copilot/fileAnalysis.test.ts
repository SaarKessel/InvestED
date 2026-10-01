import { describe, expect, it } from "vitest";
import { buildFileRequest, checkFile, fileSystemPrompt, giveConsent, hasConsent, MAX_RAW_BYTES, normalizeFilePayload, parseFileResponse, rawBytes } from "./fileAnalysis";
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
describe("fileAnalysis", () => {
  it("accepts a small image and trims the question", () => {
    const p = normalizeFilePayload({ question: "  what is this?  ", language: "he", mimeType: "image/png", data: "QUJD" });
    expect(p).toEqual({ question: "what is this?", language: "he", mimeType: "image/png", data: "QUJD" });
  });
  it("rejects bad type, non-base64 and oversize", () => {
    expect(normalizeFilePayload({ mimeType: "text/html", data: "QUJD" })).toBeNull();
    expect(normalizeFilePayload({ mimeType: "image/png", data: "not base64!" })).toBeNull();
    expect(normalizeFilePayload({ mimeType: "image/png", data: "A".repeat(Math.ceil((MAX_RAW_BYTES * 4) / 3) + 8) })).toBeNull();
    expect(normalizeFilePayload(null)).toBeNull();
  });
  it("measures raw bytes", () => { expect(rawBytes("QUJD")).toBe(3); expect(rawBytes("QQ==")).toBe(1); });
  it("system prompt forbids diagnosis and invention, and follows the language", () => {
    expect(fileSystemPrompt("en")).toMatch(/cannot diagnose/); expect(fileSystemPrompt("en")).toMatch(/Never invent/); expect(fileSystemPrompt("he")).toMatch(/Hebrew/);
  });
  it("builds a request with text then inline data, with a default question", () => {
    const r = buildFileRequest({ question: "", language: "en", mimeType: "application/pdf", data: "QUJD" });
    expect(r.contents[0].parts).toHaveLength(2); expect(r.contents[0].parts[1]).toEqual({ inlineData: { mimeType: "application/pdf", data: "QUJD" } });
  });
  it("parses candidates and returns null on junk", () => {
    expect(parseFileResponse({ candidates: [{ content: { parts: [{ text: " hi " }] } }] })).toBe("hi");
    expect(parseFileResponse({})).toBeNull();
  });
  it("remembers consent and checks file types", () => {
    const s = mem(); expect(hasConsent(s)).toBe(false); giveConsent(s); expect(hasConsent(s)).toBe(true);
    expect(checkFile({ type: "image/heic", size: 10 })).toBe("type"); expect(checkFile({ type: "image/png", size: 99_000_000 })).toBe("size"); expect(checkFile({ type: "image/png", size: 1000 })).toBeNull();
  });
});
