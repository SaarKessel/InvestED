export interface QuizProgressSnapshot {
  completed: boolean;
  score: number;
  total: number;
  finishedAt?: string;
}

export interface QuizBestScore {
  score: number;
  total: number;
  finishedAt: string;
}

const QUIZ_PROGRESS_KEY = "invested_quiz_progress";
const QUIZ_BEST_KEY = "invested_quiz_best_scores";

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

// ---------------------------------------------------------------------------
// Best-score records for the dedicated trivia page, keyed by question count
// ("5" / "10" / "25"). Local-only, like every InvestED storage.
// ---------------------------------------------------------------------------

type BestScoreMap = Record<string, QuizBestScore>;

function readBestMap(): BestScoreMap {
  if (typeof window === "undefined") {
    return {};
  }
  const raw = window.localStorage.getItem(QUIZ_BEST_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as BestScoreMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getBestQuizScore(questionCount: number): QuizBestScore | null {
  return readBestMap()[String(questionCount)] ?? null;
}

/** Saves the score only when it beats the stored best for that count. */
export function recordQuizScore(questionCount: number, score: number): QuizBestScore {
  const current: QuizBestScore = {
    score,
    total: questionCount,
    finishedAt: new Date().toISOString(),
  };
  const map = readBestMap();
  const key = String(questionCount);
  const existing = map[key];
  if (!existing || score > existing.score) {
    map[key] = current;
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(QUIZ_BEST_KEY, JSON.stringify(map));
  }
  return map[key];
}
