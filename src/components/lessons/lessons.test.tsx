import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageOverride, LanguageProvider } from "@/context/languageContext";
import MoneyLessonsPage from "@/pages/MoneyLessonsPage";

const render = (lang: "he" | "en") => renderToStaticMarkup(<LanguageProvider><LanguageOverride language={lang}><MoneyLessonsPage /></LanguageOverride></LanguageProvider>);

describe("money lessons page", () => {
  it("renders every lesson in English with no Hebrew", () => {
    const html = render("en");
    for (const s of ["Did my portfolio grow", "Rent-vs-buy lab", "Calibration", "Circuit breaker", "Two-quarter 13F comparison", "not investment advice", "no presets"]) expect(html).toContain(s);
    expect(html).not.toMatch(/[א-ת]/);
  });
  it("renders every lesson in Hebrew with the SEC limits line", () => {
    const html = render("he");
    for (const s of ["שכירות מול קנייה", "מפסק זרם", "45 יום", "אינה מכירה מאושרת", "לא ייעוץ השקעות"]) expect(html).toContain(s);
  });
  it("shows no result before inputs are entered (nothing invented)", () => {
    const html = render("en");
    for (const id of ["mwr-result", "rentbuy-result", "brier-result", "compare-result", "humility-note"]) expect(html).not.toContain(id);
  });
});
