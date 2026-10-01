// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { Panel, Metric, StatusIndicator, ProvenanceBadge, ChartContainer } from "./terminal";
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root:Root; let el:HTMLDivElement;
beforeEach(()=>{el=document.createElement("div");document.body.append(el);root=createRoot(el);});
afterEach(()=>{act(()=>root.unmount());el.remove();});
it("distinguishes all seven provenance kinds in words",()=>{act(()=>root.render(<LanguageProvider>{(["data","calculation","analysis","knowledge","simulation","assumption","user-input"] as const).map(kind=><ProvenanceBadge key={kind} kind={kind}/>)}</LanguageProvider>)); expect(el.querySelectorAll("[data-kind]")).toHaveLength(7); expect(el.textContent).toContain("סימולציה");});
it("keeps financial numbers isolated LTR",()=>{act(()=>root.render(<Metric label="Value" value="$12,345.67"/>));expect(el.querySelector("bdi")?.getAttribute("dir")).toBe("ltr");expect(el.textContent).toContain("$12,345.67");});
it("never defaults status to a live connection",()=>{act(()=>root.render(<StatusIndicator state="unavailable" label="Data unavailable"/>)); expect(el.querySelector("[data-state]")?.getAttribute("data-state")).toBe("unavailable");expect(el.textContent).toBe("Data unavailable");});
it("gives panels and charts semantic names",()=>{act(()=>root.render(<Panel title="Research"><ChartContainer label="Price history">Chart</ChartContainer></Panel>));expect(el.querySelector("section")?.getAttribute("aria-label")).toBe("Research");expect(el.querySelector("figcaption")?.textContent).toBe("Price history");expect(el.querySelector("figure div")?.getAttribute("dir")).toBe("ltr");});
