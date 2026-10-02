import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { simulateMarketEvent } from "@/lib/simulator/marketEvents";
import { ToolResultCards } from "./resultCards";
import { RESULT_KEYS } from "./resultKeys";

describe("result card registry", () => {
  it("covers the ten approved result types", () => {
    expect([...RESULT_KEYS].sort()).toEqual(["calc", "desk", "filings", "fx", "marketsim", "math", "prov", "scenario", "symbol", "wb"]);
  });
  it("renders nothing when the message has no structured result", () => {
    expect(renderToStaticMarkup(<LanguageProvider><ToolResultCards message={{}} onAsk={() => {}} /></LanguageProvider>)).toBe("");
  });
  it("renders the card registered for a result type", () => {
    const html = renderToStaticMarkup(<LanguageProvider><ToolResultCards message={{ marketsim: simulateMarketEvent({ kind: "bubble" }) }} onAsk={() => {}} /></LanguageProvider>);
    expect(html).toContain('data-testid="market-sim-label-top"');
  });
});
