import { describe, it, expect } from "vitest";
import {
  normalizeNewsFeed,
  buildKeyFacts,
  buildImplications,
  eventTypeLabel,
} from "./newsIntelligence";

const RAW = [
  {
    title: "AAPL beats quarterly earnings expectations",
    url: "https://example.com/aapl-earnings",
    source: "ExampleWire",
    publishedAt: "2026-09-20T14:00:00.000Z",
  },
  {
    title: "Fed holds interest rates steady as inflation cools",
    url: "https://example.com/fed-rates",
    source: "MacroDaily",
    publishedAt: "2026-09-19T09:30:00.000Z",
  },
  {
    title: "Local bakery opens second branch",
    url: "https://example.com/bakery",
    source: "TownNews",
    publishedAt: "2026-09-18T12:00:00.000Z",
  },
];

describe("news enrichment", () => {
  const events = normalizeNewsFeed(RAW, ["AAPL", "MSFT"]);

  it("classifies events and detects known symbols", () => {
    expect(events).toHaveLength(3);
    expect(events[0].eventType).toBe("earnings");
    expect(events[0].symbols).toEqual(["AAPL"]);
    expect(events[1].eventType).toBe("macroeconomic");
    expect(events[2].eventType).toBe("unknown");
  });

  it("builds key facts only from provider-supported data", () => {
    const facts = buildKeyFacts(events[0], "en");
    const byLabel = Object.fromEntries(facts.map((f) => [f.label, f.value]));
    expect(byLabel["Source"]).toBe("ExampleWire");
    expect(byLabel["Classification"]).toBe("Earnings");
    expect(byLabel["Detected symbols"]).toBe("AAPL");
    expect(byLabel["Published"]).toBeTruthy();
  });

  it("localizes key facts and labels", () => {
    const factsHe = buildKeyFacts(events[0], "he");
    expect(factsHe.map((f) => f.label)).toContain("מקור");
    expect(eventTypeLabel("earnings", "he")).toBe("דוחות כספיים");
    expect(eventTypeLabel("earnings", "en")).toBe("Earnings");
  });

  it("separates implications by scope and language", () => {
    const en = buildImplications(events[0], "en");
    expect(en.some((i) => i.scope === "company")).toBe(true);
    expect(en.some((i) => i.scope === "sector")).toBe(true);
    const he = buildImplications(events[0], "he");
    expect(he.length).toBe(en.length);
    expect(he[0].text).not.toBe(en[0].text);
    const macro = buildImplications(events[1], "en");
    expect(macro.some((i) => i.scope === "macro")).toBe(true);
  });

  it("never invents implications for unclassified items", () => {
    expect(buildImplications(events[2], "en")).toEqual([]);
    expect(buildImplications(events[2], "he")).toEqual([]);
  });

  it("drops malformed raw items instead of fabricating news", () => {
    const result = normalizeNewsFeed(
      [
        { title: "", url: "https://x.com/a", source: "S", publishedAt: "2026-09-20T00:00:00Z" },
        { title: "T", url: "not-a-url", source: "S", publishedAt: "2026-09-20T00:00:00Z" },
        { title: "T", url: "https://x.com/b", source: "S", publishedAt: "garbage" },
      ],
      []
    );
    expect(result).toEqual([]);
  });
});
