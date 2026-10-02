// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { setLanguagePreference } from "@/lib/languagePreferenceStorage";
import { MemoryPanel } from "./MemoryPanel";
import type { MemoryApi } from "@/lib/memory/memoryApi";
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root; let container: HTMLDivElement;
beforeEach(() => { setLanguagePreference("en"); container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
function api(over: Partial<MemoryApi> = {}): MemoryApi {
  return { getConsent: vi.fn().mockResolvedValue(false), setConsent: vi.fn().mockResolvedValue(undefined), exportMemory: vi.fn().mockResolvedValue({ exportedAt: "x", consent: false, items: [], savedAnswers: [] }), deleteAll: vi.fn().mockResolvedValue(undefined), remember: vi.fn().mockResolvedValue(true), missedQuiz: vi.fn().mockResolvedValue([]), noteMissedQuiz: vi.fn().mockResolvedValue(true), clearMissedQuiz: vi.fn().mockResolvedValue(undefined), ...over };
}
async function mount(a: MemoryApi) { act(() => root.render(<LanguageProvider><MemoryPanel api={a} /></LanguageProvider>)); await flush(); }

describe("MemoryPanel", () => {
  it("starts off and turning it on calls setConsent(true)", async () => {
    const a = api(); await mount(a);
    const sw = container.querySelector<HTMLInputElement>("input[role=switch]")!;
    expect(sw.checked).toBe(false);
    expect(container.textContent).toContain("Off by default");
    await act(async () => { sw.click(); });
    expect(a.setConsent).toHaveBeenCalledWith(true);
  });
  it("delete needs a second confirming click", async () => {
    const a = api({ getConsent: vi.fn().mockResolvedValue(true) }); await mount(a);
    const del = [...container.querySelectorAll("button")].find((b) => b.textContent === "Delete all my memory")!;
    await act(async () => { del.click(); });
    expect(a.deleteAll).not.toHaveBeenCalled();
    const yes = [...container.querySelectorAll("button")].find((b) => b.textContent === "Yes, delete")!;
    await act(async () => { yes.click(); });
    expect(a.deleteAll).toHaveBeenCalledTimes(1);
    expect(container.querySelector<HTMLInputElement>("input[role=switch]")!.checked).toBe(false);
  });
  it("export calls exportMemory", async () => {
    URL.createObjectURL = vi.fn(() => "blob:x"); URL.revokeObjectURL = vi.fn();
    const a = api(); await mount(a);
    const ex = [...container.querySelectorAll("button")].find((b) => b.textContent === "Export my data")!;
    await act(async () => { ex.click(); });
    expect(a.exportMemory).toHaveBeenCalled();
  });
  it("shows unavailable when tables are missing", async () => {
    await mount(api({ getConsent: vi.fn().mockRejectedValue(new Error("no table")) }));
    expect(container.textContent).toContain("not available");
    expect(container.querySelector("input[role=switch]")).toBeNull();
  });
});
