import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { ChatMarketSimCard } from "./ChatMarketSimCard";
import { MARKET_SIM_LABEL, simulateMarketEvent } from "@/lib/simulator/marketEvents";

describe("market simulator card", () => {
  const html = renderToStaticMarkup(<LanguageProvider><ChatMarketSimCard data={simulateMarketEvent({ kind: "bubble" })} /></LanguageProvider>);
  it("shows the label in both languages at the top, inside the chart and at the bottom", () => {
    expect(html).toContain('data-testid="market-sim-label-top"');
    expect(html).toContain('data-testid="market-sim-label-bottom"');
    expect(html.split(MARKET_SIM_LABEL.he).length - 1).toBeGreaterThanOrEqual(3);
    expect(html.split(MARKET_SIM_LABEL.en).length - 1).toBeGreaterThanOrEqual(3);
  });
  it("names no real market", () => {
    expect(html).not.toMatch(/S&amp;P|NASDAQ|Dow|Yahoo|live/i);
  });
});
