// @vitest-environment jsdom
import {act} from "react";
import {createRoot,type Root} from "react-dom/client";
import {MemoryRouter} from "react-router-dom";
import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {LanguageProvider} from "@/context/languageContext";
import {ThemeProvider} from "@/context/themeContext";
import {TerminalShell} from "./TerminalShell";
vi.mock("@/context/useAuth",()=>({useAuth:()=>({user:{email:"owner@example.invalid"}})}));
vi.mock("@/components/layout/TickerStrip",()=>({TickerStrip:()=>null}));
vi.mock("@/components/layout/NewsPopup",()=>({NewsPopup:()=>null}));
vi.mock("@/components/dashboard/ChatToolPanel",()=>({ChatToolPanel:()=> <div data-testid="existing-tool">Existing tool</div>}));
(globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root;let el:HTMLDivElement;
beforeEach(()=>{localStorage.setItem("invested_language_preference","en");el=document.createElement("div");document.body.append(el);root=createRoot(el);});
afterEach(()=>{act(()=>root.unmount());el.remove();});
function mount(path="/"){act(()=>root.render(<LanguageProvider><ThemeProvider><MemoryRouter initialEntries={[path]}><TerminalShell><textarea aria-label="AI"/></TerminalShell></MemoryRouter></ThemeProvider></LanguageProvider>));}
it("offers primary navigation, workspace, AI and status landmarks",()=>{mount();expect(el.querySelector('aside[aria-label="Primary navigation"]')).not.toBeNull();expect(el.querySelector("main")).not.toBeNull();expect(el.querySelector('aside[aria-label="Financial copilot"]')).not.toBeNull();expect(el.querySelector("footer")?.textContent).toContain("Data status shown per result");expect(el.textContent).not.toContain("DATA CONNECTED");});
it("uses existing tools rather than duplicating their business logic",()=>{mount("/research");expect(el.querySelector('[data-testid="existing-tool"]')).not.toBeNull();expect(el.querySelector('main')?.getAttribute("aria-label")).toBe("Asset Research");});
it("changes density without changing workspace state",()=>{mount();const select=el.querySelector('select')!;act(()=>{select.value="terminal";select.dispatchEvent(new Event("change",{bubbles:true}));});expect(el.querySelector('[data-density]')?.getAttribute('data-density')).toBe("terminal");expect(el.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe("Intelligence");});
it("focuses the real AI composer from the top bar",()=>{mount();act(()=>el.querySelector<HTMLButtonElement>('.terminal-search')!.click());expect(document.activeElement).toBe(el.querySelector('textarea'));});
it("supports mirrored Hebrew shell and accessible mobile menu",()=>{localStorage.setItem('invested_language_preference','he');mount();expect(el.querySelector('.terminal-shell')?.getAttribute('dir')).toBe('rtl');const menu=el.querySelector<HTMLButtonElement>('.terminal-mobile-menu')!;act(()=>menu.click());expect(menu.getAttribute('aria-expanded')).toBe('true');expect(el.querySelector('.terminal-navigation')?.classList.contains('is-open')).toBe(true);});
