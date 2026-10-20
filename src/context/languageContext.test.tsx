// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider, useLanguage, type LanguageContextValue } from "./languageContext";
import heLocale from "@/locales/he.json";
import enLocale from "@/locales/en.json";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root; let container: HTMLDivElement; let current: LanguageContextValue;

const Probe = () => { current = useLanguage(); return null; };
const mount = () => act(() => root.render(<LanguageProvider><Probe /></LanguageProvider>));

beforeEach(() => { localStorage.clear(); container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe("LanguageProvider", () => {
  it("defaults to Hebrew with rtl on the document", () => {
    mount();
    expect(current.language).toBe("he");
    expect(current.dir).toBe("rtl");
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("he");
  });
  it("restores a stored English preference", () => {
    localStorage.setItem("invested_language_preference", "en");
    mount();
    expect(current.language).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
  });
  it("toggleLanguage flips he <-> en, updates dir/lang and persists", () => {
    mount();
    act(() => current.toggleLanguage());
    expect(current.language).toBe("en");
    expect(current.dir).toBe("ltr");
    expect(document.documentElement.dir).toBe("ltr");
    expect(document.documentElement.lang).toBe("en");
    expect(localStorage.getItem("invested_language_preference")).toBe("en");
    act(() => current.toggleLanguage());
    expect(current.language).toBe("he");
    expect(document.documentElement.dir).toBe("rtl");
    expect(localStorage.getItem("invested_language_preference")).toBe("he");
  });
  it("setLanguage switches directly", () => {
    mount();
    act(() => current.setLanguage("en"));
    expect(current.language).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
  });
  it("t returns the translation in the active language", () => {
    mount();
    const key = Object.keys(heLocale).find((k) => heLocale[k as keyof typeof heLocale] && enLocale[k as keyof typeof enLocale] && heLocale[k as keyof typeof heLocale] !== enLocale[k as keyof typeof enLocale])!;
    expect(current.t(key)).toBe(heLocale[key as keyof typeof heLocale]);
    act(() => current.setLanguage("en"));
    expect(current.t(key)).toBe(enLocale[key as keyof typeof enLocale]);
  });
  it("t falls back to the fallback string, then the key", () => {
    mount();
    expect(current.t("no_such_key_xyz", "fallback!")).toBe("fallback!");
    expect(current.t("no_such_key_xyz")).toBe("no_such_key_xyz");
  });
});

describe("locale dictionaries", () => {
  it("he and en expose the same key set", () => {
    const he = Object.keys(heLocale).sort();
    const en = Object.keys(enLocale).sort();
    expect(en).toEqual(he);
  });
  it("no value is an empty string", () => {
    for (const [k, v] of Object.entries(heLocale)) expect(v, `he:${k}`).not.toBe("");
    for (const [k, v] of Object.entries(enLocale)) expect(v, `en:${k}`).not.toBe("");
  });
  it("the English locale contains no Hebrew characters", () => {
    for (const [k, v] of Object.entries(enLocale)) expect(v, `en:${k}`).not.toMatch(/[֐-׿]/);
  });
});
