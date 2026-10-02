import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageOverride, LanguageProvider } from "@/context/languageContext";
import { ToolResultCards } from "./resultCards";
import type { MacroResult } from "@/lib/copilot/macroDesk";

const imf: MacroResult = { kind: "imf", indicator: "PCPIPCH", country: "ISR", countryName: { en: "Israel", he: "ישראל" }, retrievedOn: "2026-10-02", points: [{ year: 2025, value: 3.1, projected: false }, { year: 2026, value: 2.7, projected: true }] };
const ecb: MacroResult = { kind: "ecb_rate", rate: { series: [{ date: "2025-06-11", ratePct: 2.15 }], latest: { date: "2025-06-11", ratePct: 2.15 } } };
const render = (lang: "he" | "en", d: MacroResult) => renderToStaticMarkup(<LanguageProvider><LanguageOverride language={lang}><ToolResultCards message={{ macro: d }} onAsk={() => {}} /></LanguageOverride></LanguageProvider>);

describe("macro card in the registry", () => {
  it("English IMF: projections marked, not an InvestED forecast", () => {
    const h = render("en", imf);
    expect(h).toContain("2026 (IMF est.)");
    expect(h).not.toContain("2025 (IMF est.)");
    expect(h).toContain("not an InvestED forecast");
    expect(h).not.toMatch(/[א-ת]/);
  });
  it("Hebrew IMF: Hebrew labels", () => {
    const h = render("he", imf);
    expect(h).toContain("הערכת IMF");
    expect(h).toContain("אינפלציה");
  });
  it("ECB rate shows the decision date", () => {
    expect(render("en", ecb)).toContain("2.15%");
    expect(render("en", ecb)).toContain("2025-06-11");
    expect(render("he", ecb)).toContain("ריבית המדיניות");
  });
});
