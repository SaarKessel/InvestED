// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { ChatStrategyFitCard } from "./ChatStrategyFitCard";
import type { StrategyFitAssessment } from "@/types";
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

function fit(overrides: Partial<StrategyFitAssessment> = {}): StrategyFitAssessment {
  return {
    status: "assessed",
    strategyId: "dividend",
    fit: "moderate",
    reasons: ["ציון הסיכון בפרופיל: 6/10 מול רמת הסיכון המאפיינת את האסטרטגיה: 4/10.", "רמות הסיכון במרחק בינוני - התאמה חינוכית חלקית."],
    disclaimer: "מידע לימודי בלבד, לא ייעוץ.",
    ...overrides,
  };
}

describe("chat strategy fit card", () => {
  it("renders fit level, reasons and disclaimer from the engine", () => {
    act(() => root.render(<LanguageProvider><ChatStrategyFitCard fit={fit()} /></LanguageProvider>));
    expect(container.textContent).toContain("התאמה לימודית");
    expect(container.textContent).toContain("התאמה חלקית");
    expect(container.textContent).toContain("dividend");
    expect(container.textContent).toContain("ציון הסיכון");
    expect(container.textContent).toContain("מידע לימודי בלבד");
  });

  it("renders the profile-needed state without a fit level", () => {
    act(() => root.render(<LanguageProvider><ChatStrategyFitCard fit={fit({ status: "needs_profile", fit: null, reasons: ["חסר פרופיל משקיע אמיתי."] })} /></LanguageProvider>));
    expect(container.textContent).toContain("נדרש פרופיל משקיע");
    expect(container.textContent).toContain("חסר פרופיל משקיע אמיתי.");
    expect(container.textContent).not.toContain("התאמה חלקית");
  });
});
