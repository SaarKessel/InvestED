import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageOverride, LanguageProvider } from "@/context/languageContext";
import { ToolResultCards } from "./resultCards";
import type { CopyFundResult } from "@/lib/copilot/copyFundDesk";

const data: CopyFundResult = {
  cik: "0001067983", managerName: { en: "Berkshire Hathaway", he: "ברקשייר" }, filerName: "BERKSHIRE", reportDate: "2026-06-30", filingDate: "2026-08-14", sourceUrl: "https://www.sec.gov/x", topCount: 15, today: "2026-10-02",
  matched: [], unmatched: [{ issuer: "ALPHABET INC", valueUsd: 5, reason: "several_tickers" }],
  copy: { coveragePct: 80, notPriced: [], fromFilingDate: { entryDate: "2026-08-15", latestDate: "2026-10-01", portfolioReturnPct: 5, spyReturnPct: 3, legs: [{ ticker: "AAPL", weightPct: 100, entry: 100, latest: 105, returnPct: 5 }] }, fromQuarterEnd: { entryDate: "2026-06-30", portfolioReturnPct: 9, spyReturnPct: 4 } },
};
const render = (d: CopyFundResult, lang: "he" | "en") => renderToStaticMarkup(<LanguageProvider><LanguageOverride language={lang}><ToolResultCards message={{ copyfund: d }} onAsk={() => {}} /></LanguageOverride></LanguageProvider>);

describe("copy-the-fund card", () => {
  it("shows both entries, SPY, exclusions and the SEC-based caveats in English and Hebrew", () => {
    const en = render(data, "en");
    expect(en).toContain('data-testid="copyfund-card"'); expect(en).toContain("+5.0%"); expect(en).toContain("Hindsight only"); expect(en).toContain("ALPHABET INC");
    expect(en).toContain("45 days"); expect(en).toContain("Short positions are not reported"); expect(en).toContain("not proof of a sale"); expect(en).toContain("not investment advice");
    const he = render(data, "he");
    expect(he).toContain("45 יום"); expect(he).toContain("לא ייעוץ השקעות");
  });
  it("shows no result rather than a made-up one when prices are missing", () => {
    const none = { ...data, copy: { ...data.copy, fromFilingDate: null, fromQuarterEnd: null } };
    const html = render(none, "en");
    expect(html).toContain("no result is shown"); expect(html).not.toContain("copyfund-result");
  });
});
