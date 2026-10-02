import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageOverride, LanguageProvider } from "@/context/languageContext";
import { ToolResultCards } from "./resultCards";
import { runOutOfSample } from "@/lib/portfolio/outOfSample";
import type { OosDeskResult } from "@/lib/copilot/oosDesk";

function hist(n: number, seed: number) {
  let s = seed, p = 100; const out: { date: string; close: number }[] = []; const d = new Date("2020-01-01T00:00:00Z");
  for (let i = 0; i < n; i++) { s = (s * 1664525 + 1013904223) % 4294967296; p *= 1 + 0.0004 + (s / 4294967296 - 0.5) * 0.02; out.push({ date: d.toISOString().slice(0, 10), close: p }); d.setUTCDate(d.getUTCDate() + 1); }
  return out;
}
const outcome = runOutOfSample(["AAA", "BBB"], [hist(900, 1), hist(900, 2)], hist(900, 3));
const ok: OosDeskResult = { symbols: ["AAA", "BBB"], outcome, unavailable: [] };
const render = (d: OosDeskResult, lang: "he" | "en") => renderToStaticMarkup(<LanguageProvider><LanguageOverride language={lang}><ToolResultCards message={{ oos: d }} onAsk={() => {}} /></LanguageOverride></LanguageProvider>);

describe("out-of-sample card", () => {
  it("shows train and test, never-seen data, a verdict and the disclaimer in both languages", () => {
    const en = render(ok, "en");
    expect(en).toContain('data-testid="oos-card"'); expect(en).toContain("Test, never seen"); expect(en).toContain('data-testid="oos-verdict"'); expect(en).toContain("Minimum variance"); expect(en).toContain("not investment advice");
    const he = render(ok, "he");
    expect(he).toContain("בדיקה מחוץ למדגם"); expect(he).toContain("לא ייעוץ השקעות");
  });
  it("shows a plain reason and no numbers when data is missing", () => {
    const bad: OosDeskResult = { symbols: ["AAA", "BBB"], outcome: { ok: false, reason: "too_little_history" }, unavailable: ["BBB"] };
    const html = render(bad, "en");
    expect(html).toContain("no real price history for: BBB"); expect(html).not.toContain("oos-result");
  });
});
