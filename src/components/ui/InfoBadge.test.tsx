// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { InfoBadge } from "./InfoBadge";
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
describe("dashboard info disclosure", () => {
  it("has a touch-size trigger, announces expansion, and closes with Escape", () => {
    act(() => root.render(<LanguageProvider><InfoBadge description="Educational explanation" /></LanguageProvider>));
    const button = container.querySelector("button")!;
    expect(button.classList.contains("h-11") && button.classList.contains("w-11")).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    act(() => { button.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true })); button.click(); });
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(button.getAttribute("aria-controls")!)?.textContent).toContain("Educational explanation");
    expect(document.getElementById(button.getAttribute("aria-controls")!)?.classList.contains("end-0")).toBe(true);
    act(() => button.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById(button.getAttribute("aria-controls")!)).toBeNull();
  });
});
