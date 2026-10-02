// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { VoiceOrb } from "./VoiceOrb";
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root; let container: HTMLDivElement;
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const mount = (accent?: string | null) => act(() => root.render(<LanguageProvider><VoiceOrb state="idle" accent={accent} onClose={() => {}} onTapOrb={() => {}} note={null} /></LanguageProvider>));

describe("VoiceOrb accent", () => {
  it("sets the orb colour from the topic agent", () => {
    mount("152 60% 38%");
    const b = document.body.querySelector<HTMLElement>(".orb-wrap")!;
    expect(b.style.getPropertyValue("--orb-accent")).toBe("152 60% 38%");
  });
  it("keeps the default colour without a topic", () => {
    mount(null);
    expect(document.body.querySelector<HTMLElement>(".orb-wrap")!.style.getPropertyValue("--orb-accent")).toBe("");
  });
});
