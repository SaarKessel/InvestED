import { describe, expect, it } from "vitest";
import { resolveSiteIntent, SITE_CAPABILITIES } from "./siteCapabilities";
import en from "../../locales/en.json";
import he from "../../locales/he.json";

describe("site capabilities", () => {
  it("opens the loan calculator page in English and Hebrew", () => {
    const a = resolveSiteIntent("open the loans page"); expect(a).toMatchObject({ kind: "open" });
    expect(a && a.kind === "open" && a.matches[0].route).toBe("/loans");
    const b = resolveSiteIntent("תפתח לי את ההלוואות"); expect(b && b.kind === "open" && b.matches[0].route).toBe("/loans");
  });
  it("prefers the most specific match", () => {
    const r = resolveSiteIntent("take me to the analyst game");
    expect(r && r.kind === "open" && r.matches.map((m) => m.route)).toEqual(["/career-lab/analyst-game"]);
  });
  it("answers overview questions in both languages", () => {
    expect(resolveSiteIntent("what can you do?")).toEqual({ kind: "overview" });
    expect(resolveSiteIntent("מה אתה יכול לעשות")).toEqual({ kind: "overview" });
  });
  it("leaves ordinary finance questions to the engines", () => {
    expect(resolveSiteIntent("What is VOO price?")).toBeNull();
    expect(resolveSiteIntent("explain RSI")).toBeNull();
    expect(resolveSiteIntent("open a position in news stocks")).not.toBeNull();
  });
  it("has bilingual copy for every capability", () => {
    for (const c of SITE_CAPABILITIES) for (const k of [`cap_${c.id}_name`, `cap_${c.id}_desc`]) {
      expect((en as Record<string, string>)[k]).toBeTruthy(); expect((he as Record<string, string>)[k]).toBeTruthy();
    }
  });

  it("launches role and strategy pages from natural wishes", () => {
    const id = (q: string) => { const r = resolveSiteIntent(q); return r && r.kind === "open" ? r.matches[0].id : null; };
    expect(id("I want to try being an accountant")).toBe("accountant-game");
    expect(id("Let me practice as an investment analyst")).toBe("analyst-game");
    expect(id("I want to compare strategies")).toBe("strategy");
    expect(id("רוצה לנסות להיות מנהל תיק")).toBe("portfolio-game");
    expect(id("what is VOO price")).toBeNull();
  });
});
