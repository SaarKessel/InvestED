// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { LEVELS } from "@/lib/copilot/levels";
import { ChatToolMenu, type ChatActionId } from "./ChatToolMenu";

vi.mock("@/lib/knowledge/knowledgeClient", () => ({ isOwner: () => Promise.resolve(false) }));

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root; let container: HTMLDivElement;
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

const mount = (query: string | null, onAction: (id: ChatActionId) => void = () => {}) =>
  act(() => root.render(
    <MemoryRouter><LanguageProvider>
      <ChatToolMenu query={query} onPlus={() => {}} onPick={() => {}} onAttach={() => {}} onAction={onAction} level={LEVELS[0].id} onLevel={() => {}} />
    </LanguageProvider></MemoryRouter>,
  ));

describe("ChatToolMenu", () => {
  it("stays closed without a query and exposes menu aria on the plus button", () => {
    mount(null);
    const plus = document.body.querySelector<HTMLButtonElement>("button[aria-haspopup='menu']")!;
    expect(plus.getAttribute("aria-expanded")).toBe("false");
    expect(document.body.querySelector("[role='menu']")).toBeNull();
  });
  it("opens with all tools for an empty query and hides owner-only entries", () => {
    mount("");
    expect(document.body.querySelector("[role='menu']")).not.toBeNull();
    const links = [...document.body.querySelectorAll<HTMLAnchorElement>("a[role='menuitem']")].map((a) => a.getAttribute("href"));
    expect(links).toContain("/gapsheet");
    expect(links).toContain("/privacy");
    expect(links).not.toContain("/knowledge");
    const accept = document.body.querySelector<HTMLInputElement>("input[type='file']")!.getAttribute("accept")!;
    expect(accept).toContain(".csv");
    expect(accept).toContain(".xlsx");
  });
  it("filters tools by the typed needle", () => {
    mount("gapsheet");
    const links = [...document.body.querySelectorAll<HTMLAnchorElement>("a[role='menuitem']")].map((a) => a.getAttribute("href"));
    expect(links).toEqual(["/gapsheet"]);
  });
  it("routes a chat action click to onAction", () => {
    let picked: ChatActionId | null = null;
    mount("history", (id) => { picked = id; });
    const items = [...document.body.querySelectorAll<HTMLButtonElement>("button[role='menuitem']")];
    const item = items[items.length - 1]; // attach buttons come first; the filtered action is last
    act(() => item.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(picked).toBe("history");
  });
});
