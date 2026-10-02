// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { EvidenceWorksheet, EvidenceWorksheetPanel } from "./EvidenceWorksheet";
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root; let container: HTMLDivElement;
beforeEach(() => { localStorage.setItem("invested_language_preference", "en"); container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe("EvidenceWorksheet", () => {
  it("reveals the checklist reading, source and unverified items after the learner picks", () => {
    act(() => root.render(<LanguageProvider><EvidenceWorksheet headline="Acme profit rose 12%" /></LanguageProvider>));
    expect(container.querySelector('[data-testid="worksheet-reveal"]')).toBeNull();
    const pick = [...container.querySelectorAll("button")][0];
    act(() => pick.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    const reveal = container.querySelector('[data-testid="worksheet-reveal"]')!;
    expect(reveal.textContent).toMatch(/quarterly|annual|earnings/i);
    expect(container.textContent).toMatch(/no verdict|not a fact-check/i);
  });
  it("panel offers synthetic examples and opens a worksheet", () => {
    act(() => root.render(<LanguageProvider><EvidenceWorksheetPanel /></LanguageProvider>));
    const ex = [...container.querySelectorAll("button")].find((b) => /Example/.test(b.textContent ?? ""))!;
    act(() => ex.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(container.querySelector('[data-testid="evidence-worksheet"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="worksheet-loud"]')!.textContent).toMatch(/not proof/i);
  });
});

describe("EvidenceWorksheet in Hebrew", () => {
  it("renders Hebrew labels and RTL direction", () => {
    localStorage.setItem("invested_language_preference", "he");
    act(() => root.render(<LanguageProvider><EvidenceWorksheet headline="מניית אקמי ירדה ב-40%" /></LanguageProvider>));
    expect(container.querySelector('[data-testid="evidence-worksheet"]')!.getAttribute("dir")).toBe("rtl");
    expect(container.textContent).toContain("דף ראיות");
    expect(container.textContent).not.toMatch(/Your call/);
  });
});
