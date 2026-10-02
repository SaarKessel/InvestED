import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageOverride, LanguageProvider } from "@/context/languageContext";
import { ToolResultCards } from "./resultCards";
import type { FilingsResult } from "@/lib/copilot/filingsDesk";

const data: FilingsResult = {
  cik: "0001067983", managerName: { en: "Berkshire Hathaway", he: "ברקשייר" }, filerName: "BERKSHIRE HATHAWAY INC",
  reportDate: "2026-06-30", filingDate: "2026-08-14", form: "13F-HR", reportedTotalValueUsd: 299253556246, reportedEntryCount: 89,
  sourceUrl: "https://www.sec.gov/Archives/edgar/data/1067983/x/56757.xml",
  holdings: [{ issuer: "APPLE INC", titleOfClass: "COM", cusip: "037833100", valueUsd: 65950296923, shares: 227917808, shareType: "SH", weightPct: 22.04 }],
};
const render = (lang: "he" | "en") => renderToStaticMarkup(<LanguageProvider><LanguageOverride language={lang}><ToolResultCards message={{ filings: data }} onAsk={() => {}} /></LanguageOverride></LanguageProvider>);

describe("13F card in the registry", () => {
  it("renders in English with dates, values and the limits line", () => {
    const html = render("en");
    expect(html).toContain('data-testid="filings-card"');
    expect(html).toContain("Holdings per Form 13F");
    expect(html).toContain("APPLE INC");
    expect(html).toContain("$65.95B");
    expect(html).toContain("2026-06-30");
    expect(html).toContain("not a live portfolio");
    expect(html).not.toMatch(/[א-ת]/);
  });
  it("renders fully in Hebrew when the question was Hebrew (override), whatever the UI language", () => {
    const html = render("he");
    expect(html).toContain("החזקות לפי טופס 13F");
    expect(html).toContain("ברקשייר");
    expect(html).toContain("אינו תיק חי");
    expect(html).not.toContain("Holdings per");
  });
});
