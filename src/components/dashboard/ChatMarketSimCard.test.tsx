import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { ChatMarketSimCard } from "./ChatMarketSimCard";
import { MARKET_SIM_LABEL, simulateMarketEvent } from "@/lib/simulator/marketEvents";

describe("market simulator card", () => {
  const html = renderToStaticMarkup(<LanguageProvider><ChatMarketSimCard data={simulateMarketEvent({ kind: "bubble" })} /></LanguageProvider>);
  it("shows the label in the active language at the top, inside the chart and at the bottom", () => {
    expect(html).toContain('data-testid="market-sim-label-top"');
    expect(html).toContain('data-testid="market-sim-label-bottom"');
    const label = html.includes(MARKET_SIM_LABEL.he) ? MARKET_SIM_LABEL.he : MARKET_SIM_LABEL.en;
    expect(html.split(label).length - 1).toBeGreaterThanOrEqual(3);
    // one language per card: the other label must not leak in
    const other = label === MARKET_SIM_LABEL.he ? MARKET_SIM_LABEL.en : MARKET_SIM_LABEL.he;
    expect(html).not.toContain(other);
  });
  it("names no real market", () => {
    expect(html).not.toMatch(/S&amp;P|NASDAQ|Dow|Yahoo|live/i);
  });
});
