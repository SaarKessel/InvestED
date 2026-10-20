// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { ThemeProvider } from "@/context/themeContext";

vi.mock("@/components/dashboard/AIChatCard", () => ({ AIChatCard: ({ workstation }: { workstation?: boolean }) => <div data-testid={workstation ? "chat-workstation" : "chat-only"} /> }));
vi.mock("@/components/layout/NewsPopup", () => ({ NewsPopup: () => null }));
let authed = true;
vi.mock("@/context/useAuth", () => ({ useAuth: () => ({ user: authed ? { email: "owner@example.invalid", id: "u1" } : null, loading: false }) }));

import AICopilotPage from "./AICopilotPage";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root; let el: HTMLDivElement;
beforeEach(() => { authed = true; localStorage.clear(); localStorage.setItem("invested_language_preference", "en"); el = document.createElement("div"); document.body.append(el); root = createRoot(el); });
afterEach(() => { act(() => root.unmount()); el.remove(); });
function mount(path = "/") { act(() => root.render(<LanguageProvider><ThemeProvider><MemoryRouter initialEntries={[path]}><AICopilotPage /></MemoryRouter></ThemeProvider></LanguageProvider>)); }

it("signed-in users land in the chat-only shell", () => {
  mount();
  expect(el.querySelector('[data-testid="chat-only"]')).not.toBeNull();
  expect(el.querySelector('.fx-waves')).not.toBeNull();
});

it("ignores the removed ?shell=terminal fallback and stays in the chat shell", () => {
  mount("/news?shell=terminal");
  expect(el.querySelector('[data-testid="chat-only"]')).not.toBeNull();
  expect(el.querySelector('.fx-waves')).not.toBeNull();
});

it("signed-out visitors see the entry screen without shell chrome", () => {
  authed = false;
  mount();
  expect(el.querySelector('.fx-waves')).toBeNull();
});
