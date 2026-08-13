export interface QuizProgressSnapshot {
  completed: boolean;
  score: number;
  total: number;
  finishedAt?: string;
}

const QUIZ_PROGRESS_KEY = "invested_quiz_progress";

export function getQuizProgress(): QuizProgressSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(QUIZ_PROGRESS_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as QuizProgressSnapshot;
    return parsed;
  } catch {
    return null;
  }
}

export function saveQuizProgress(progress: QuizProgressSnapshot): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(progress));
}

export function clearQuizProgress(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(QUIZ_PROGRESS_KEY);
}
