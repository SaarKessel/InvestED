import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageOverride, LanguageProvider } from "@/context/languageContext";
import { ToolResultCards } from "./resultCards";
import type { EtfResult } from "@/lib/copilot/etfDesk";

const data: EtfResult = { ticker: "VOO", seriesName: "VANGUARD 500 INDEX FUND", reportDate: "2026-06-30", filingDate: "2026-08-28", netAssetsUsd: 1.67e12, totalHoldingCount: 520, shownWeightPct: 18.4, sourceUrl: "https://www.sec.gov/x",
  holdings: [{ name: "NVIDIA Corp", title: "NVIDIA", cusip: "67066G104", isin: "", balance: 1, units: "NS", valueUsd: 1e11, weightPct: 7.514, assetCategory: "EC", payoffProfile: "Long" }] };
const render = (lang: "he" | "en") => renderToStaticMarkup(<LanguageProvider><LanguageOverride language={lang}><ToolResultCards message={{ etf: data }} onAsk={() => {}} /></LanguageOverride></LanguageProvider>);

describe("ETF card in the registry", () => {
  it("English: report date leads, lag stated, no Hebrew", () => {
    const html = render("en");
    expect(html).toContain('data-testid="etf-card"');
    expect(html).toContain("Holdings as of ");
    expect(html).toContain("2026-06-30");
    expect(html).toContain("NVIDIA Corp");
    expect(html).toContain("7.514%");
    expect(html).toContain("can be months old");
    expect(html).not.toMatch(/[א-ת]/);
  });
  it("Hebrew override renders the card in Hebrew", () => {
    const html = render("he");
    expect(html).toContain("נתוני החזקות נכון ל-");
    expect(html).toContain("מקור: דוח N-PORT");
    expect(html).not.toContain("Holdings as of");
  });
});
