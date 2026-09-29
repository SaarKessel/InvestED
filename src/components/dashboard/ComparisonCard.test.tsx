// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { ComparisonCard } from "./ComparisonCard";
(globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
describe("dashboard strategy comparison accessibility", () => {
 it("exposes choices and scrolling table in Hebrew RTL", () => {
  act(() => root.render(<LanguageProvider><ComparisonCard /></LanguageProvider>));
  const group = container.querySelector('[role="group"]');
  expect(group?.getAttribute("aria-label")).toContain("שלוש");
  const choices = [...group!.querySelectorAll('button')];
  expect(choices.filter(b=>b.getAttribute('aria-pressed')==='true')).toHaveLength(3);
  expect(choices.filter(b=>b.disabled)).toHaveLength(1);
  expect(choices.every(b=>b.classList.contains('min-h-11'))).toBe(true);
  act(() => choices[0].click());
  expect(choices[0].getAttribute('aria-pressed')).toBe('false');
  expect(choices.every(b=>!b.disabled)).toBe(true);
  const region = container.querySelector('[role="region"]');
  expect(region?.getAttribute('tabindex')).toBe('0');
  expect(region?.getAttribute('aria-label')).toContain('השוואה');
  expect(container.querySelectorAll('th[scope="col"]')).toHaveLength(3);
  expect(container.querySelectorAll('th[scope="row"]')).toHaveLength(5);
 });
});
