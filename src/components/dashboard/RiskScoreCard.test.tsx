// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import type { AnalysisResult } from "@/types";
import { RiskScoreCard } from "./ProfileSummaryCards";
(globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
function render(score: number) { act(() => root.render(<LanguageProvider><RiskScoreCard result={{ riskScore: score } as AnalysisResult} /></LanguageProvider>)); }
describe("dashboard risk-score meter", () => {
 it("labels the actual scenario score on a 0-10 scale", () => {
  render(6);
  const meter = container.querySelector('[role="progressbar"]');
  expect(meter?.getAttribute('aria-label')).toBe('ציון סיכון');
  expect(meter?.getAttribute('aria-valuenow')).toBe('6');
  expect(meter?.getAttribute('aria-valuemax')).toBe('10');
  expect((meter?.firstElementChild as HTMLElement).style.width).toBe('60%');
 });
 it("does not invent a zero when no score is available", () => {
  render(Number.NaN);
  expect(container.querySelector('[role="progressbar"]')?.hasAttribute('aria-valuenow')).toBe(false);
  expect(container.textContent).toContain('לא הוגדר');
 });
});
