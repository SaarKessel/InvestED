import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { LearningConstellation } from "./LearningConstellation";

describe("landing learning illustration", () => {
  it("shows three bilingual-ready learning paths with an explicit non-market-data boundary", () => {
    const html = renderToStaticMarkup(<LanguageProvider><LearningConstellation /></LanguageProvider>);
    expect(html).toContain("להבין נתונים");
    expect(html).toContain("להשוות תרחישים");
    expect(html).toContain("ללמוד עם AI");
    expect(html).toContain("לא נתוני שוק");
    expect(html).not.toContain("live price");
  });
});
