// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/context/languageContext";

const ask = vi.fn();
vi.mock("@/lib/copilot/fileClient", () => ({ prepareFile: async () => ({ name: "s.png", mimeType: "image/jpeg", data: "AAAA" }), askAboutFile: (...a: unknown[]) => ask(...a) }));
import { ShowYourWork } from "./ShowYourWork";
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root; let container: HTMLDivElement;
beforeEach(() => { localStorage.setItem("invested_language_preference", "en"); localStorage.setItem("invested.fileConsent.v1", "yes"); container = document.createElement("div"); document.body.append(container); root = createRoot(container); act(() => root.render(<LanguageProvider><ShowYourWork /></LanguageProvider>)); });
afterEach(() => { act(() => root.unmount()); container.remove(); ask.mockReset(); });
async function upload() {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(input, "files", { value: [new File([new Uint8Array(10)], "s.png", { type: "image/png" })], configurable: true });
  await act(async () => { input.dispatchEvent(new Event("change", { bubbles: true })); });
}
const vals = () => [...container.querySelectorAll<HTMLInputElement>('input[inputmode="decimal"]')].map((i) => i.value);

describe("ShowYourWork photo path", () => {
  it("fills the fields from the transcription but computes nothing until confirmed", async () => {
    ask.mockResolvedValue('{"principal": 2000, "monthly": 50, "years": 5, "annualPct": 4}');
    await upload();
    expect(ask.mock.calls[0][1]).toMatch(/Do not solve it/);
    expect(vals()).toEqual(["2000", "50", "5", "4"]);
    expect(container.querySelector('[data-testid="photo-msg"]')!.textContent).toMatch(/check every field/);
    expect(container.querySelector('[data-testid="pad-result"]')).toBeNull();
    const confirm = [...container.querySelectorAll("button")].find((b) => /I checked the inputs/.test(b.textContent ?? ""))!;
    act(() => { confirm.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    expect(container.querySelector('[data-testid="pad-result"]')).not.toBeNull();
  });
  it("service fallback (quota or outage) leaves the fields empty and tells the learner to type", async () => {
    ask.mockResolvedValue(null);
    await upload();
    expect(container.querySelector('[data-testid="photo-msg"]')!.textContent).toMatch(/Type the numbers/);
    expect(vals().every((v) => v === "")).toBe(true);
  });
  it("garbage output is rejected, not guessed from", async () => {
    ask.mockResolvedValue("The answer is probably 12,000.");
    await upload();
    expect(container.querySelector('[data-testid="photo-msg"]')!.textContent).toMatch(/Type the numbers/);
    expect(vals().every((v) => v === "")).toBe(true);
  });
});
