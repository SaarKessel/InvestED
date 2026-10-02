import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/** Every former site page, now opened inside the chat thread. */
export interface ChatTool { id: string; path: string; labelKey: string; group: "learn" | "practice" | "tools" | "account" | "about"; }

export const CHAT_TOOLS: ChatTool[] = [
  { id: "start", path: "/start", labelKey: "tool_start", group: "learn" },
  { id: "learn", path: "/learn", labelKey: "nav_learn", group: "learn" },
  { id: "career", path: "/career-lab", labelKey: "nav_career", group: "practice" },
  { id: "strategy", path: "/strategy-lab", labelKey: "nav_strategy_lab", group: "practice" },
  { id: "simulation", path: "/simulation", labelKey: "nav_simulation", group: "practice" },
  { id: "trivia", path: "/trivia", labelKey: "nav_trivia", group: "practice" },
  { id: "calculator", path: "/calculator", labelKey: "nav_calculator", group: "tools" },
  { id: "loans", path: "/loans", labelKey: "cap_loans_name", group: "tools" },
  { id: "insurance", path: "/insurance-reports", labelKey: "cap_insurance_name", group: "tools" },
  { id: "markets", path: "/markets", labelKey: "terminal_markets", group: "tools" },
  { id: "research", path: "/research", labelKey: "nav_research", group: "tools" },
  { id: "news", path: "/news", labelKey: "nav_news", group: "tools" },
  { id: "dashboard", path: "/dashboard", labelKey: "cap_dashboard_name", group: "tools" },
  { id: "overview", path: "/overview", labelKey: "nav_overview", group: "about" },
  { id: "data", path: "/data-controls", labelKey: "cap_data_name", group: "account" },
  { id: "knowledge", path: "/knowledge", labelKey: "tool_knowledge", group: "account" },
  { id: "intelligence", path: "/intelligence", labelKey: "tool_intelligence", group: "tools" },
  { id: "knowledge-map", path: "/knowledge-map", labelKey: "tool_knowledge_map", group: "tools" },
  { id: "system-health", path: "/system-health", labelKey: "tool_system_health", group: "account" },
  { id: "about", path: "/about", labelKey: "nav_about", group: "about" },
  { id: "faq", path: "/faq", labelKey: "nav_faq", group: "about" },
  { id: "contact", path: "/contact", labelKey: "nav_contact", group: "about" },
  { id: "privacy", path: "/privacy", labelKey: "tool_privacy", group: "about" },
  { id: "terms", path: "/terms", labelKey: "tool_terms", group: "about" },
];

type Page = LazyExoticComponent<ComponentType>;
/** path -> page. Sub-pages (the career games) are reachable from inside their parent tool. */
export const TOOL_PAGES: Record<string, Page> = {
  "/start": lazy(() => import("@/pages/InputPage").then((m) => ({ default: m.InputPage }))),
  "/learn": lazy(() => import("@/pages/LearnPage")),
  "/career-lab": lazy(() => import("@/pages/CareerLabPage")),
  "/career-lab/portfolio-game": lazy(() => import("@/pages/PortfolioGamePage")),
  "/career-lab/analyst-game": lazy(() => import("@/pages/AnalystGamePage")),
  "/career-lab/operations-game": lazy(() => import("@/pages/OperationsGamePage")),
  "/career-lab/accountant-game": lazy(() => import("@/pages/AccountantGamePage")),
  "/strategy-lab": lazy(() => import("@/pages/StrategyLabPage")),
  "/simulation": lazy(() => import("@/pages/SimulationPage")),
  "/trivia": lazy(() => import("@/pages/TriviaPage")),
  "/calculator": lazy(() => import("@/pages/CalculatorPage")),
  "/loans": lazy(() => import("@/pages/LoanLearningPage")),
  "/insurance-reports": lazy(() => import("@/pages/InsuranceReportsPage")),
  "/markets": lazy(() => import("@/components/terminal/MarketsWorkspace")),
  "/research": lazy(() => import("@/pages/AssetResearchPage")),
  "/news": lazy(() => import("@/pages/NewsPage")),
  "/dashboard": lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))),
  "/overview": lazy(() => import("@/pages/LandingPage").then((m) => ({ default: m.LandingPage }))),
  "/data-controls": lazy(() => import("@/pages/DataControlsPage")),
  "/knowledge": lazy(() => import("@/pages/KnowledgePage")),
  "/intelligence": lazy(() => import("@/pages/IntelligenceDashboardPage")),
  "/knowledge-map": lazy(() => import("@/pages/KnowledgeMapPage")),
  "/system-health": lazy(() => import("@/pages/SystemHealthPage")),
  "/about": lazy(() => import("@/pages/AboutPage").then((m) => ({ default: m.AboutPage }))),
  "/faq": lazy(() => import("@/pages/FaqPage").then((m) => ({ default: m.FaqPage }))),
  "/contact": lazy(() => import("@/pages/ContactPage").then((m) => ({ default: m.ContactPage }))),
  "/privacy": lazy(() => import("@/pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage }))),
  "/terms": lazy(() => import("@/pages/TermsPage").then((m) => ({ default: m.TermsPage }))),
};

export function toolForPath(pathname: string): { path: string; page: Page; tool: ChatTool | undefined } | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const page = TOOL_PAGES[clean];
  if (!page) return null;
  const tool = CHAT_TOOLS.filter((x) => clean === x.path || clean.startsWith(`${x.path}/`)).sort((a, b) => b.path.length - a.path.length)[0];
  return { path: clean, page, tool };
}
