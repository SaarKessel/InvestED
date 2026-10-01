import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/context/languageContext";
import { AuthProvider } from "@/context/authContext";
import { AnalysisProvider } from "@/context/AnalysisContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "@/components/layout/Layout";
const AICopilotPage = lazy(() => import("@/pages/AICopilotPage"));

function PageLoading() {
  return (
    <Layout>
      <main className="container py-20" role="status" aria-live="polite">
        <div className="mx-auto h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <span className="sr-only">Loading page</span>
      </main>
    </Layout>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AnalysisProvider>
          <BrowserRouter>
            <Routes>
              <Route path="*" element={<Suspense fallback={<PageLoading />}><AICopilotPage /></Suspense>} />
            </Routes>
          </BrowserRouter>
        </AnalysisProvider>
      </ThemeProvider>
      </ErrorBoundary>
      </AuthProvider>
    </LanguageProvider>
);
}
