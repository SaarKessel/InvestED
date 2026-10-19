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

import { VoiceDot } from "./VoiceOrb";
describe("VoiceOrb states and VoiceDot", () => {
  const noop = () => {};
  it("shows heard text, reply and language chips, and switches language", () => {
    let picked = "";
    act(() => root.render(<LanguageProvider><VoiceOrb state="speaking" onClose={noop} onTapOrb={noop} note={null} heard="שלום" reply="Hi there" speechLang="he" onLang={(l) => { picked = l; }} onStopSpeech={noop} /></LanguageProvider>));
    expect(document.body.querySelector("[data-testid=orb-heard]")?.textContent).toContain("שלום");
    expect(document.body.querySelector("[data-testid=orb-reply]")?.textContent).toContain("Hi there");
    const chips = [...document.body.querySelectorAll<HTMLButtonElement>("[aria-pressed]")].filter((b) => /English/.test(b.textContent ?? ""));
    act(() => chips[0].click());
    expect(picked).toBe("en");
  });
  it("hides the reply while listening and shows an alert note in the error state", () => {
    act(() => root.render(<LanguageProvider><VoiceOrb state="error" onClose={noop} onTapOrb={noop} note="mic blocked" reply="old answer" /></LanguageProvider>));
    expect(document.body.querySelector("[role=alert]")?.textContent).toBe("mic blocked");
    act(() => root.render(<LanguageProvider><VoiceOrb state="listening" onClose={noop} onTapOrb={noop} note={null} reply="old answer" /></LanguageProvider>));
    expect(document.body.querySelector("[data-testid=orb-reply]")).toBeNull();
  });
  it("closes on Escape", () => {
    let closed = 0;
    act(() => root.render(<LanguageProvider><VoiceOrb state="idle" onClose={() => { closed++; }} onTapOrb={noop} note={null} /></LanguageProvider>));
    act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); });
    expect(closed).toBe(1);
  });
  it("renders an accessible launcher that opens voice mode", () => {
    let opened = 0;
    act(() => root.render(<LanguageProvider><VoiceDot state="idle" onOpen={() => { opened++; }} /></LanguageProvider>));
    const b = document.body.querySelector<HTMLButtonElement>("[data-testid=voice-dot]")!;
    expect(b.getAttribute("aria-label")).toBeTruthy();
    act(() => b.click());
    expect(opened).toBe(1);
  });
});
