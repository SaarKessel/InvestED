import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageOverride, LanguageProvider } from "@/context/languageContext";
import { ToolResultCards } from "./resultCards";
import { summarizeDividends } from "@/lib/copilot/dividendDesk";

const NOW = new Date("2026-10-02T12:00:00Z");
const mk = (dates: string[], shares: number | null) => summarizeDividends({ symbol: "AAPL", shares, focus: "expected" }, { name: "Apple Inc.", currency: "USD", price: 200, priceAsOf: "2026-10-01", dividends: dates.map((date) => ({ date, amount: 0.26 })) }, NOW);
const render = (lang: "he" | "en", data: ReturnType<typeof mk>) => renderToStaticMarkup(<LanguageProvider><LanguageOverride language={lang}><ToolResultCards message={{ dividends: data }} onAsk={() => {}} /></LanguageOverride></LanguageProvider>);
const Q = ["2025-11-07", "2026-02-09", "2026-05-11", "2026-08-10"];

describe("dividend card", () => {
  it("English: history, labeled estimate, shares math, no Hebrew", () => {
    const html = render("en", mk(Q, 100));
    expect(html).toContain('data-testid="dividend-card"');
    expect(html).toContain("Paid in the last 12 months");
    expect(html).toContain("$1.04");
    expect(html).toContain("estimate, not a declared payout");
    expect(html).toContain("$104");
    expect(html).toContain("not investment advice");
    expect(html).not.toMatch(/[א-ת]/);
  });
  it("Hebrew renders in Hebrew", () => {
    const html = render("he", mk(Q, null));
    expect(html).toContain("שולם ב-12 החודשים האחרונים");
    expect(html).toContain("הערכה, לא הכרזה");
    expect(html).not.toContain("Paid in the last");
  });
  it("no dividends: honest empty state, no estimate block", () => {
    const html = render("en", mk([], null));
    expect(html).toContain('data-testid="dividend-none"');
    expect(html).not.toContain('data-testid="dividend-expected"');
  });
  it("stopped dividend shows no estimate", () => {
    const html = render("en", mk(["2023-01-10", "2023-04-10", "2023-07-10"], null));
    expect(html).toContain("may have stopped");
  });
});
