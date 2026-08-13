import type { AnalysisResult } from "@/types";

const HISTORY_STORAGE_KEY = "invested_analysis_history";
const CONSENT_STORAGE_KEY = "invested_analysis_history_consent";

export interface AnalysisHistoryEntry extends AnalysisResult {
  id: string;
  savedAt: string;
}

export function getHistoryConsent(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(CONSENT_STORAGE_KEY) === "true";
}

export function setHistoryConsent(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CONSENT_STORAGE_KEY, String(enabled));
}

export function getAnalysisHistory(): AnalysisHistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as AnalysisHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendAnalysisHistory(result: AnalysisResult): AnalysisHistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const history = getAnalysisHistory();
  const entry: AnalysisHistoryEntry = {
    ...result,
    id: typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    savedAt: new Date().toISOString(),
  };

  const nextHistory = [entry, ...history].slice(0, 10);
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));

  return nextHistory;
}

export function clearAnalysisHistory(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(HISTORY_STORAGE_KEY);
}
