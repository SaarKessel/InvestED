import { describe, expect, it } from "vitest";
import { loadCopyFund, parseCopyFundRequest } from "./copyFundDesk";
import { parseFilingsRequest } from "./filingsDesk";

describe("copy fund desk", () => {
  it("fires on copy intent with a known manager, in both languages", () => {
    expect(parseCopyFundRequest("what if I had copied Berkshire's 13F")).toMatchObject({ cik: "0001067983" });
    expect(parseCopyFundRequest("מה אם הייתי מעתיק את ברקשייר")).toMatchObject({ cik: "0001067983" });
    expect(parseCopyFundRequest("copy cik 1350694")).toMatchObject({ cik: "0001350694" });
  });
  it("stays quiet without a manager or without copy intent, and leaves plain holdings questions alone", () => {
    expect(parseCopyFundRequest("copy my homework")).toBeNull();
    expect(parseCopyFundRequest("what does Berkshire hold")).toBeNull();
    expect(parseFilingsRequest("what does Berkshire hold")).not.toBeNull();
  });
  it("returns null on a bad response", async () => {
    const bad = (async () => ({ ok: true, json: async () => ({}) })) as unknown as typeof fetch;
    expect(await loadCopyFund({ cik: "1", managerName: { en: "x", he: "x" } }, bad)).toBeNull();
    const down = (async () => ({ ok: false })) as unknown as typeof fetch;
    expect(await loadCopyFund({ cik: "1", managerName: { en: "x", he: "x" } }, down)).toBeNull();
  });
});
