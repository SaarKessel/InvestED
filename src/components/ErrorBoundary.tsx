import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/context/languageContext";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

function ErrorBoundaryFallback({ handleReset }: { handleReset: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center text-foreground">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="font-display text-xl font-bold">{t("error_title", "Something went wrong")}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t("error_desc", "An unexpected error occurred while loading the page. You can try again or return to the home page.")}
      </p>
      <button
        onClick={handleReset}
        className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        {t("error_home", "Back to Home")}
      </button>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("InvestED — שגיאת זמן ריצה שנתפסה:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return <ErrorBoundaryFallback handleReset={this.handleReset} />;
    }
    return this.props.children;
  }
}
