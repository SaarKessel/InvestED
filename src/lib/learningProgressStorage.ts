export const LEARNING_PROGRESS_KEY = "invested_learning_progress";

export function getLearningProgress(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(LEARNING_PROGRESS_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

export function saveLearningProgress(progress: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = [...new Set(progress.filter(Boolean))];
  window.localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(normalized));
}

export function clearLearningProgress(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LEARNING_PROGRESS_KEY);
}
