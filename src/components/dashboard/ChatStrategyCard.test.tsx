// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { ChatStrategyCard } from "./ChatStrategyCard";
import type { StrategyExplanation } from "@/lib/strategy/strategyEngine";
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

const explanation = {
  name: "השקעת דיבידנדים",
  riskLabel: "סיכון נמוך-בינוני",
  riskLevel: 4,
  strengths: ["זרם הכנסה שוטף", "חברות מבוססות"],
  limitations: ["תלות במדיניות הדיבידנד"],
  educationalNotes: "התוכן לצורכי למידה בלבד.",
} as unknown as StrategyExplanation;

describe("chat strategy card", () => {
  it("renders name, risk, strengths, limitations and notes from the engine", () => {
    act(() => root.render(<LanguageProvider><ChatStrategyCard explanation={explanation} /></LanguageProvider>));
    expect(container.textContent).toContain("השקעת דיבידנדים");
    expect(container.textContent).toContain("סיכון נמוך-בינוני");
    expect(container.textContent).toContain("4/10");
    expect(container.textContent).toContain("נקודות חוזק");
    expect(container.textContent).toContain("זרם הכנסה שוטף");
    expect(container.textContent).toContain("מגבלות");
    expect(container.textContent).toContain("תלות במדיניות הדיבידנד");
    expect(container.textContent).toContain("התוכן לצורכי למידה בלבד.");
  });
});
