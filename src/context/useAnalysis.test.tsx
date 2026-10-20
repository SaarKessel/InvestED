// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useAnalysis } from "./useAnalysis";
import { AnalysisContext, type AnalysisContextValue } from "./AnalysisContext";
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root; let el: HTMLDivElement;
const mount = (node: React.ReactNode) => {
  el = document.createElement("div"); document.body.append(el); root = createRoot(el);
  act(() => root.render(node));
};
afterEach(() => { act(() => root.unmount()); el.remove(); });

function Probe({ onValue }: { onValue: (v: AnalysisContextValue) => void }) {
  onValue(useAnalysis());
  return null;
}

describe("useAnalysis", () => {
  it("throws outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => mount(<Probe onValue={() => {}} />)).toThrow("useAnalysis must be used inside AnalysisProvider");
    spy.mockRestore();
  });
  it("returns the provided context value", () => {
    const value = { marker: "ctx" } as unknown as AnalysisContextValue;
    let got: AnalysisContextValue | null = null;
    mount(<AnalysisContext.Provider value={value}><Probe onValue={(v) => { got = v; }} /></AnalysisContext.Provider>);
    expect(got).toBe(value);
  });
});
