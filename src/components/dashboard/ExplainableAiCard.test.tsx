// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import type { AnalysisResult } from "@/types";
import { ExplainableAiCard } from "./ExplainableAiCard";
(globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
describe("dashboard explainability signal labels", () => {
 it("shows Hebrew names for computed signal types, not raw implementation identifiers", () => {
  const result = { riskScore: 6, investor: { type: "balanced", reason: "" }, aiNarration: {}, explainability: { summary: "", signals: [
   { title: "risk", description: "risk explanation", type: "risk" },
   { title: "growth", description: "growth explanation", type: "growth" },
   { title: "confidence", description: "confidence explanation", type: "confidence" },
  ] } } as AnalysisResult;
  act(() => root.render(<LanguageProvider><ExplainableAiCard result={result} /></LanguageProvider>));
  expect(container.textContent).toContain('ניתוח צמיחה');
  expect(container.textContent).toContain('רמת ביטחון');
  expect(container.textContent).not.toContain('growth explanationgrowth');
  expect(container.textContent).not.toContain('risk explanationrisk');
 });
});
