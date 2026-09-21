import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/context/languageContext";
import { AnalysisProvider } from "@/context/AnalysisContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LandingPage } from "@/pages/LandingPage";
import { InputPage } from "@/pages/InputPage";
import { DashboardPage } from "@/pages/DashboardPage";
import CalculatorPage from "@/pages/CalculatorPage";
import { AboutPage } from "@/pages/AboutPage";
import { FaqPage } from "@/pages/FaqPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { TermsPage } from "@/pages/TermsPage";
import { ContactPage } from "@/pages/ContactPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

const StrategyLabPage = lazy(() => import("@/pages/StrategyLabPage"));
const AssetResearchPage = lazy(() => import("@/pages/AssetResearchPage"));
const AICopilotPage = lazy(() => import("@/pages/AICopilotPage"));
const TriviaPage = lazy(() => import("@/pages/TriviaPage"));
const NewsPage = lazy(() => import("@/pages/NewsPage"));
const SimulationPage = lazy(() => import("@/pages/SimulationPage"));
const LearnPage = lazy(() => import("@/pages/LearnPage"));
const DataControlsPage = lazy(() => import("@/pages/DataControlsPage"));

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AnalysisProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/start" element={<InputPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/calculator" element={<CalculatorPage />} />
              <Route path="/research" element={<Suspense fallback={null}><AssetResearchPage /></Suspense>} />
              <Route path="/chat" element={<Suspense fallback={null}><AICopilotPage /></Suspense>} />
              <Route path="/trivia" element={<Suspense fallback={null}><TriviaPage /></Suspense>} />
              <Route path="/news" element={<Suspense fallback={null}><NewsPage /></Suspense>} />
              <Route path="/simulation" element={<Suspense fallback={null}><SimulationPage /></Suspense>} />
              <Route path="/learn" element={<Suspense fallback={null}><LearnPage /></Suspense>} />
              <Route
                path="/strategy-lab"
                element={
                  <Suspense fallback={null}>
                    <StrategyLabPage />
                  </Suspense>
                }
              />
              <Route path="/data-controls" element={<Suspense fallback={null}><DataControlsPage /></Suspense>} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AnalysisProvider>
      </ThemeProvider>
    </LanguageProvider>
  </ErrorBoundary>
);
}
