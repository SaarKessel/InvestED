export type LearningLevel = "foundation" | "builder" | "advanced";
export type LearningGoal = "confidence" | "portfolio" | "analysis";
export type JourneyStepId = "lesson" | "practice" | "simulation" | "reflection";

export interface LearningDiagnostic {
  level: LearningLevel;
  goal: LearningGoal;
  minutesPerWeek: 30 | 60 | 120;
  completedAt: string;
}

export interface LearningJourneyState {
  diagnostic: LearningDiagnostic | null;
  completedSteps: JourneyStepId[];
  reflection: string;
  updatedAt: string;
}

export const LEARNING_JOURNEY_KEY = "invested_learning_journey_v1";

export const EMPTY_LEARNING_JOURNEY: LearningJourneyState = {
  diagnostic: null,
  completedSteps: [],
  reflection: "",
  updatedAt: "",
};

export function readLearningJourney(): LearningJourneyState {
  if (typeof window === "undefined") return EMPTY_LEARNING_JOURNEY;
  const raw = window.localStorage.getItem(LEARNING_JOURNEY_KEY);
  if (!raw) return EMPTY_LEARNING_JOURNEY;
  try {
    const value = JSON.parse(raw) as Partial<LearningJourneyState>;
    return {
      diagnostic: value.diagnostic ?? null,
      completedSteps: Array.isArray(value.completedSteps)
        ? value.completedSteps.filter((step): step is JourneyStepId =>
            ["lesson", "practice", "simulation", "reflection"].includes(String(step)))
        : [],
      reflection: typeof value.reflection === "string" ? value.reflection.slice(0, 1000) : "",
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
    };
  } catch {
    return EMPTY_LEARNING_JOURNEY;
  }
}

export function saveLearningJourney(state: LearningJourneyState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LEARNING_JOURNEY_KEY, JSON.stringify({
    ...state,
    completedSteps: [...new Set(state.completedSteps)],
    reflection: state.reflection.slice(0, 1000),
    updatedAt: new Date().toISOString(),
  }));
}

export function journeyProgress(state: LearningJourneyState): number {
  if (!state.diagnostic) return 0;
  return Math.round((1 + state.completedSteps.length) / 5 * 100);
}

export function nextJourneyStep(state: LearningJourneyState): JourneyStepId | "diagnostic" | "complete" {
  if (!state.diagnostic) return "diagnostic";
  return (["lesson", "practice", "simulation", "reflection"] as JourneyStepId[])
    .find((step) => !state.completedSteps.includes(step)) ?? "complete";
}
