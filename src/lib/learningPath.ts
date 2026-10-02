// ---------------------------------------------------------------------------
// InvestED - rule-based learning-path recommender (no ML)
//
// Input: the /learn diagnostic (level, goal, minutes per week) plus the topic
// self-check ("topics I already feel sure about") and, optionally, the best
// short-quiz score. Output: the weak topics in a fixed, explainable order.
// ---------------------------------------------------------------------------
import type { LearningGoal, LearningLevel } from "./learningJourney";

export type TopicId = "basics" | "risk" | "fees" | "diversification" | "compound" | "emergency" | "valuation";
export interface PathTopic { id: TopicId; minLevel: LearningLevel; he: string; en: string }

/** Prerequisite order: earlier topics come first unless a goal pulls one forward. */
export const PATH_TOPICS: PathTopic[] = [
  { id: "basics", minLevel: "foundation", he: "מניות, אג״ח וקרנות סל", en: "Stocks, bonds and ETFs" },
  { id: "risk", minLevel: "foundation", he: "סיכון מול תשואה", en: "Risk vs. return" },
  { id: "emergency", minLevel: "foundation", he: "קרן חירום", en: "Emergency fund" },
  { id: "compound", minLevel: "foundation", he: "ריבית דריבית", en: "Compound interest" },
  { id: "fees", minLevel: "foundation", he: "דמי ניהול ועמלות", en: "Fees and commissions" },
  { id: "diversification", minLevel: "builder", he: "פיזור השקעות", en: "Diversification" },
  { id: "valuation", minLevel: "advanced", he: "הערכת שווי", en: "Valuation" },
];

const LEVEL_RANK: Record<LearningLevel, number> = { foundation: 0, builder: 1, advanced: 2 };
/** Topics a goal pulls forward (never ahead of "basics"). */
const GOAL_FOCUS: Record<LearningGoal, TopicId[]> = {
  confidence: ["risk", "emergency"],
  portfolio: ["diversification", "fees"],
  analysis: ["valuation", "risk"],
};
/** Topics per plan size, from minutes per week. */
const STEPS_BY_MINUTES: Record<30 | 60 | 120, number> = { 30: 2, 60: 3, 120: 5 };
/** A short-quiz score under this share re-opens the first two topics. */
export const QUIZ_REVIEW_BELOW = 0.6;

export interface PathInput {
  level: LearningLevel;
  goal: LearningGoal;
  minutesPerWeek: 30 | 60 | 120;
  knownTopics: TopicId[];
  quiz?: { score: number; total: number } | null;
}
export interface PathStep { topic: TopicId; he: string; en: string; reason: "quiz" | "goal" | "unchecked"; }
export interface PathResult { steps: PathStep[]; weakCount: number; allKnown: boolean }

export function recommendPath(input: PathInput): PathResult {
  const known = new Set(input.knownTopics);
  const quizWeak = !!input.quiz && input.quiz.total > 0 && input.quiz.score / input.quiz.total < QUIZ_REVIEW_BELOW;
  const eligible = PATH_TOPICS.filter((t) => LEVEL_RANK[t.minLevel] <= LEVEL_RANK[input.level]);
  const weak = eligible.filter((t) => !known.has(t.id) || (quizWeak && (t.id === "basics" || t.id === "risk")));
  const focus = GOAL_FOCUS[input.goal];
  const rank = (t: PathTopic) => (t.id === "basics" ? -1 : focus.includes(t.id) ? 0 : 1);
  const ordered = weak
    .map((t, i) => ({ t, i }))
    .sort((a, b) => rank(a.t) - rank(b.t) || a.i - b.i)
    .map(({ t }) => t);
  const steps = ordered.slice(0, STEPS_BY_MINUTES[input.minutesPerWeek]).map<PathStep>((t) => ({
    topic: t.id, he: t.he, en: t.en,
    reason: quizWeak && (t.id === "basics" || t.id === "risk") ? "quiz" : focus.includes(t.id) ? "goal" : "unchecked",
  }));
  return { steps, weakCount: weak.length, allKnown: weak.length === 0 };
}
