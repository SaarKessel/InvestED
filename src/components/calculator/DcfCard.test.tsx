// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { LanguageProvider } from "@/context/languageContext";
import { DcfCard } from "./DcfCard";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement; let root: Root;
function mount() { container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); act(() => root.render(<LanguageProvider><DcfCard /></LanguageProvider>)); }
function type(i: number, v: string) {
  const el = container.querySelectorAll("input")[i] as HTMLInputElement;
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => { set.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); });
}
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe("DcfCard", () => {
  it("shows a scenario for the default inputs, with n/a per share and the not-a-valuation note", () => {
    mount();
    expect(container.querySelector('[data-testid="dcf-card"]')).not.toBeNull();
    expect(container.textContent).toMatch(/not a valuation|לא הערכת שווי/);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(container.textContent).toMatch(/n\/a|לא זמין/);
  });
  it("shows an error, not numbers, when terminal growth is not below the discount rate", () => {
    mount();
    type(3, "12");
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.querySelector("table")).toBeNull();
  });
  it("asks to fill required fields instead of computing from blanks", () => {
    mount();
    type(0, "");
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    expect(container.querySelector("table")).toBeNull();
  });
  it("computes per share when net debt and shares are given", () => {
    mount();
    type(5, "0"); type(6, "10");
    expect(container.textContent).not.toMatch(/Per share[^\n]*n\/a/);
    expect(container.querySelectorAll("dd")[2].textContent).not.toMatch(/n\/a|לא זמין/);
  });
});
