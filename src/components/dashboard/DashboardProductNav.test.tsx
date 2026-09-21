import { renderToStaticMarkup } from "react-dom/server";
import { describe,it,expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/context/languageContext";
import { DashboardProductNav, DashboardUnavailableModules } from "./DashboardProductNav";
describe("unified dashboard navigation",()=>{it("links product surfaces and labels unavailable modules truthfully",()=>{const html=renderToStaticMarkup(<LanguageProvider><MemoryRouter><DashboardProductNav/><DashboardUnavailableModules/></MemoryRouter></LanguageProvider>);expect(html).toContain('/research');expect(html).toContain('/strategy-lab');expect(html).toContain('לא מוצגים נתוני דמה');});});
