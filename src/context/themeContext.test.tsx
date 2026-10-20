// @vitest-environment jsdom
import { act, useContext } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ThemeContext, ThemeProvider, type ThemeContextValue } from "./themeContext";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root; let container: HTMLDivElement;
let seen: ThemeContextValue | null = null;
function Probe() { seen = useContext(ThemeContext); return null; }

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("light", "dark");
  seen = null;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe("ThemeProvider (light-only)", () => {
  it("forces light over a saved dark preference", () => {
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
    act(() => root.render(<ThemeProvider><Probe /></ThemeProvider>));
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(seen!.theme).toBe("light");
  });
  it("setTheme and toggleTheme are no-ops that keep the light theme", () => {
    act(() => root.render(<ThemeProvider><Probe /></ThemeProvider>));
    act(() => { seen!.setTheme("dark"); seen!.toggleTheme(); });
    expect(seen!.theme).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
