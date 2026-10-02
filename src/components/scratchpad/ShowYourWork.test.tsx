// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { ShowYourWork } from "./ShowYourWork";
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root; let container: HTMLDivElement;
const click = (el: Element) => act(() => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
function type(el: HTMLInputElement, v: string) { act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); }); }
const btn = (re: RegExp) => [...container.querySelectorAll("button")].find((b) => re.test(b.textContent ?? ""))!;
function mount(lang: "en" | "he" = "en") { localStorage.clear(); localStorage.setItem("invested_language_preference", lang); act(() => root.render(<LanguageProvider><ShowYourWork /></LanguageProvider>)); }
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });
const inputs = () => [...container.querySelectorAll<HTMLInputElement>('input[inputmode="decimal"]')];

describe("ShowYourWork", () => {
  it("typed compound inputs: nothing is computed until the learner confirms; result comes from the engine", () => {
    mount();
    const [p, m, y, r] = inputs();
    type(p, "10000"); type(m, "500"); type(y, "20"); type(r, "7");
    expect(container.querySelector('[data-testid="pad-result"]')).toBeNull();
    click(btn(/I checked the inputs/));
    const res = container.querySelector('[data-testid="pad-result"]')!;
    expect(res.textContent).toContain("130,000");
    expect(container.querySelector('[data-testid="timeline"]')).not.toBeNull();
    type(y, "21");
    expect(container.querySelector('[data-testid="pad-result"]')).toBeNull();
  });
  it("invalid input shows a message and no result", () => {
    mount();
    click(btn(/I checked the inputs/));
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="pad-result"]')).toBeNull();
  });
  it("cash-flow mode shows a discount table and present value", () => {
    mount();
    click(btn(/Cash-flow timeline/));
    const rows = () => [...container.querySelectorAll('[data-testid="flow-row"]')];
    type(inputs()[0], "10");
    const [r0, r1] = rows();
    type(r0.querySelectorAll("input")[1] as HTMLInputElement, "-1000");
    type(r1.querySelectorAll("input")[1] as HTMLInputElement, "1100");
    click(btn(/I checked the inputs/));
    expect(container.querySelector('[data-testid="pad-result"]')!.textContent).toMatch(/Present value/);
    expect(container.querySelector('[data-testid="pad-result"]')!.textContent).toContain("0.9091");
  });
  it("photo picker asks for consent first", () => {
    mount();
    click(btn(/Fill from a photo/));
    expect(container.querySelector('[data-testid="pad-consent"]')).not.toBeNull();
  });
  it("Hebrew renders RTL", () => {
    mount("he");
    expect(container.querySelector('[data-testid="show-your-work"]')!.getAttribute("dir")).toBe("rtl");
    expect(container.textContent).toContain("הראו את החישוב");
  });
});
