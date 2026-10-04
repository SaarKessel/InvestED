import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LanguageOverride, LanguageProvider } from "@/context/languageContext";
import { ChatCalcCard } from "@/components/dashboard/ChatCalcCard";
import { analyzeFinancialScenario } from "../calculatorEngine";
import { runCalcDesk } from "./calcDesk";
import { planQuestion } from "./planner";

const prompt = 'אם אשקיע 20,000 ש"ח בריבית שנתית של 8% ל-15 שנים, כמה יהיה לי?';
const expectedBalance = Math.round(20_000 * (1 + 0.08 / 12) ** (15 * 12));

describe("B191 explicit Hebrew annual interest drives the growth projection", () => {
  it.each([
    prompt,
    'אשקיע 20,000 ש"ח בריבית שנתית 8% ל-15 שנים',
    'אשקיע 20,000 ש"ח בריבית של 8% ל-15 שנים',
    'אשקיע 20,000 ש"ח בתשואה שנתית של 8% ל-15 שנים',
  ])("uses the stated rate, not the asset default: %s", (text) => {
    expect(analyzeFinancialScenario(text).annualReturnPct).toBe(8);
    const result = runCalcDesk(text)!;
    expect(result).not.toBeNull();
    expect(result.returnPct).toBe(8);
    expect(result.principal).toBe(20_000);
    expect(result.monthly).toBe(0);
    expect(result.years).toBe(15);
    expect(result.finalBalance).toBe(expectedBalance);
  });

  it("the live chat planner carries the explicit rate and computed balance", () => {
    const plan = planQuestion(prompt);
    expect(plan.route).toBe("calc");
    expect(plan.calc?.returnPct).toBe(8);
    expect(plan.calc?.finalBalance).toBe(expectedBalance);
  });

  it.each([0, 5.5, 12])("uses any stated annual rate, including zero: %s", (rate) => {
    const result = runCalcDesk(prompt.replace("8%", `${rate}%`))!;
    expect(result.returnPct).toBe(rate);
    expect(result.finalBalance).toBe(Math.round(20_000 * (1 + rate / 100 / 12) ** 180));
  });

  it.each([
    ["he", "ריבית דריבית חודשית", "השיעור השנתי מחולק ב-12"],
    ["en", "Compounded monthly", "annual rate divided by 12"],
  ] as const)("shows the compounding convention without opening details (%s)", (language, convention, formula) => {
    const result = runCalcDesk(prompt)!;
    const html = renderToStaticMarkup(
      <MemoryRouter><LanguageProvider><LanguageOverride language={language}>
        <ChatCalcCard data={result} />
      </LanguageOverride></LanguageProvider></MemoryRouter>,
    );
    const visibleSummary = html.split("<details")[0];
    expect(visibleSummary).toContain("8%");
    expect(visibleSummary).toContain(convention);
    expect(visibleSummary).toContain(formula);
    expect(visibleSummary).not.toMatch(/מומצאת|invented/);
  });
});
