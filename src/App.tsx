import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ThemeProvider } from "@/hooks/useTheme";
import { AnalysisProvider } from "@/context/AnalysisContext";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

import { LandingPage } from "@/pages/LandingPage";
import { InputPage } from "@/pages/InputPage";
import { DashboardPage } from "@/pages/DashboardPage";

import { ScenarioDetailsPage } from "@/pages/ScenarioDetailsPage";
import { AccountPage } from "@/pages/AccountPage";
import { SharedScenarioPage } from "@/pages/SharedScenarioPage";

import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";

import CalculatorPage from "@/pages/CalculatorPage";

import { AboutPage } from "@/pages/AboutPage";
import { FaqPage } from "@/pages/FaqPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { TermsPage } from "@/pages/TermsPage";
import { ContactPage } from "@/pages/ContactPage";
import { NotFoundPage } from "@/pages/NotFoundPage";



export default function App() {


return (

<ErrorBoundary>


<ThemeProvider>


<AnalysisProvider>


<BrowserRouter>


<Routes>



<Route

path="/"

element={<LandingPage />}

/>



<Route

path="/login"

element={<LoginPage />}

/>



<Route

path="/register"

element={<RegisterPage />}

/>



<Route

path="/start"

element={<InputPage />}

/>




<Route

path="/dashboard"

element={

<ProtectedRoute>

<DashboardPage />

</ProtectedRoute>

}

/>





<Route

path="/account"

element={

<ProtectedRoute>

<AccountPage />

</ProtectedRoute>

}

/>





<Route

path="/scenarios/:id"

element={

<ProtectedRoute>

<ScenarioDetailsPage />

</ProtectedRoute>

}

/>





<Route

path="/share/:id"

element={<SharedScenarioPage />}

/>





<Route

path="/calculator"

element={<CalculatorPage />}

/>





<Route

path="/about"

element={<AboutPage />}

/>



<Route

path="/faq"

element={<FaqPage />}

/>



<Route

path="/privacy"

element={<PrivacyPage />}

/>



<Route

path="/terms"

element={<TermsPage />}

/>



<Route

path="/contact"

element={<ContactPage />}

/>





<Route

path="*"

element={<NotFoundPage />}

/>



</Routes>


</BrowserRouter>


</AnalysisProvider>


</ThemeProvider>


</ErrorBoundary>


);


}
