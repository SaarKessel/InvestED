// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { LanguageProvider } from "@/context/languageContext";
import { ErrorBoundary } from "./ErrorBoundary";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function Boom(): never {
  throw new Error("boom");
}

beforeEach(() => {
  window.localStorage.clear();
  document.body.innerHTML = "";
  // ErrorBoundary logs the caught error; keep the test output clean.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("ErrorBoundary", () => {
  it("renders the localized fallback inside the LanguageProvider", async () => {
    window.localStorage.setItem("invested_language_preference", "he");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(
        <LanguageProvider>
          <ErrorBoundary>
            <Boom />
          </ErrorBoundary>
        </LanguageProvider>
      );
    });
    expect(container.textContent).toContain("משהו השתבש");
    act(() => root.unmount());
  });
});
