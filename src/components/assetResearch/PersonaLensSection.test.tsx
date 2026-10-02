import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageOverride, LanguageProvider } from "@/context/languageContext";
import { PersonaLensSection } from "./PersonaLensSection";
import { personaValueLabel } from "./personaLabels";
import type { AssetResearch } from "@/lib/research/assetResearchEngine";

const research = { symbol: "AAPL", quote: { price: 250 }, provenance: { isMock: false } } as unknown as AssetResearch;
const render = (lang: "he" | "en") => renderToStaticMarkup(<LanguageProvider><LanguageOverride language={lang}><PersonaLensSection research={research} /></LanguageOverride></LanguageProvider>);

describe("persona lens section", () => {
  it("localizes yes/no, negative, and year values in Hebrew while preserving English", () => {
    expect(personaValueLabel("yes", "he")).toBe("כן");
    expect(personaValueLabel("no", "he")).toBe("לא");
    expect(personaValueLabel("negative", "he")).toBe("שלילי");
    expect(personaValueLabel("0.8 yr", "he")).toBe("0.8 שנים");
    expect(personaValueLabel("negative", "en")).toBe("negative");
    expect(personaValueLabel("0.8 yr", "en")).toBe("0.8 yr");
  });
  it("is labeled an educational checklist, not advice, in both languages", () => {
    expect(render("en")).toContain("Educational checklist, not investment advice");
    expect(render("en")).toContain("never filled in");
    expect(render("he")).toContain("לא ייעוץ השקעות");
  });
});
