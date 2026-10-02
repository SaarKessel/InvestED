import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageOverride, LanguageProvider } from "@/context/languageContext";
import { PersonaLensSection } from "./PersonaLensSection";
import type { AssetResearch } from "@/lib/research/assetResearchEngine";

const research = { symbol: "AAPL", quote: { price: 250 }, provenance: { isMock: false } } as unknown as AssetResearch;
const render = (lang: "he" | "en") => renderToStaticMarkup(<LanguageProvider><LanguageOverride language={lang}><PersonaLensSection research={research} /></LanguageOverride></LanguageProvider>);

describe("persona lens section", () => {
  it("is labeled an educational checklist, not advice, in both languages", () => {
    expect(render("en")).toContain("Educational checklist, not investment advice");
    expect(render("en")).toContain("never filled in");
    expect(render("he")).toContain("לא ייעוץ השקעות");
  });
});
