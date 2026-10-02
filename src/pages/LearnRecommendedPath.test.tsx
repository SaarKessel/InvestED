// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import LearnPage from "./LearnPage";
import { PATH_TOPICS } from "@/lib/learningPath";
import en from "@/locales/en.json";
import he from "@/locales/he.json";

vi.mock("@/components/layout/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/layout/Footer", () => ({ Footer: () => null }));
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement; let root: Root;
beforeEach(() => { localStorage.clear(); container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

function mount(language: "he" | "en") {
  localStorage.setItem("invested_language_preference", language);
  act(() => root.render(<MemoryRouter><LanguageProvider><LearnPage /></LanguageProvider></MemoryRouter>));
}
const buildButton = () => [...container.querySelectorAll("button")].find((b) => /Build my free path|בניית המסלול/.test(b.textContent ?? ""))!;

for (const language of ["en", "he"] as const) {
  it(`${language}: topic check feeds an ordered recommended path`, () => {
    mount(language);
    expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(PATH_TOPICS.length - 0);
    const first = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    act(() => first.click());
    act(() => buildButton().click());
    const rec = container.querySelector('[data-testid="recommended-path"]')!;
    expect(rec).toBeTruthy();
    const items = rec.querySelectorAll("li");
    expect(items.length).toBe(3); // 60 min/week default
    expect(rec.textContent).not.toContain(PATH_TOPICS[0][language]); // ticked topic is skipped
    expect(rec.textContent).not.toMatch(/learn_rec_|learn_topic_/);
  });
}

it("saved diagnostic keeps the ticked topics", () => {
  mount("en");
  act(() => (container.querySelector('input[type="checkbox"]') as HTMLInputElement).click());
  act(() => buildButton().click());
  const saved = JSON.parse(localStorage.getItem("invested_learning_journey_v1")!);
  expect(saved.diagnostic.knownTopics).toEqual(["basics"]);
});

it("every new learn key exists in both languages", () => {
  const keys = [...PATH_TOPICS.map((t) => `learn_topic_${t.id}`), "learn_topics_title", "learn_topics_hint", "learn_rec_title", "learn_rec_none", "learn_rec_why_unchecked", "learn_rec_why_goal", "learn_rec_why_quiz", "learn_rec_more", "learn_rec_ask"];
  for (const k of keys) { expect((en as Record<string, string>)[k], k).toBeTruthy(); expect((he as Record<string, string>)[k], k).toBeTruthy(); }
});
