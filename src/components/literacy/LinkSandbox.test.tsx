// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { LinkSandbox } from "./LinkSandbox";
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root; let container: HTMLDivElement;
const click = (el: Element) => act(() => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
function mount(lang: "en" | "he") { localStorage.setItem("invested_language_preference", lang); act(() => root.render(<LanguageProvider><LinkSandbox /></LanguageProvider>)); }
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe("LinkSandbox", () => {
  it("renders links as text only: no anchors", () => {
    mount("en");
    expect(container.querySelectorAll("a").length).toBe(0);
    expect(container.textContent).toMatch(/Synthetic exercise/);
  });
  it("tapping the wrong part explains that the host decides", () => {
    mount("en");
    const ex = container.querySelector('[data-testid="link-exercise"]')!;
    const scheme = ex.querySelector("button")!;
    click(scheme);
    expect(ex.querySelector('[data-testid="exercise-verdict"]')!.textContent).toMatch(/Not that part/);
    expect(ex.textContent).toMatch(/Real host/);
  });
  it("tapping the host confirms and lists notices", () => {
    mount("en");
    const ex = container.querySelector('[data-testid="link-exercise"]')!;
    click([...ex.querySelectorAll("button")].find((b) => /host:/.test(b.getAttribute("aria-label") ?? ""))!);
    expect(ex.querySelector('[data-testid="exercise-verdict"]')!.textContent).toMatch(/^Yes/);
    expect(ex.querySelectorAll("[data-notice]").length).toBeGreaterThan(0);
  });
  it("Hebrew renders RTL with Hebrew labels", () => {
    mount("he");
    expect(container.querySelector('[data-testid="link-sandbox"]')!.getAttribute("dir")).toBe("rtl");
    expect(container.textContent).toContain("ארגז חול");
  });
  it("own link reading never says safe", () => {
    mount("en");
    const input = container.querySelector("input[type=text], input:not([type])") as HTMLInputElement;
    act(() => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!; set.call(input, "https://example.com/"); input.dispatchEvent(new Event("input", { bubbles: true })); });
    act(() => { input.form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
    const text = container.querySelector('[data-testid="link-reading"]:last-of-type')?.textContent ?? container.textContent!;
    expect(text).toMatch(/does not make it safe/);
  });
});
