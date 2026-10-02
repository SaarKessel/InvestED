import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageOverride, LanguageProvider, useLanguage } from "./languageContext";

function Probe() {
  const { language, t } = useLanguage();
  return <p>{`${language}|${t("calc_lead")}`}</p>;
}

describe("LanguageOverride", () => {
  it("renders children in the override language with its own direction", () => {
    const en = renderToStaticMarkup(<LanguageProvider><LanguageOverride language="en"><Probe /></LanguageOverride></LanguageProvider>);
    const he = renderToStaticMarkup(<LanguageProvider><LanguageOverride language="he"><Probe /></LanguageOverride></LanguageProvider>);
    // exactly one of the two differs from the provider default, and each shows its own language text
    expect(en).toContain("en|Here is the projection from your sentence.");
    expect(he).toContain("he|הנה התחזית מהמשפט שלך.");
  });
});
