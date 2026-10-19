import type { SkillStatus } from "./skills";
export type MasteryEvent = "ai_completed" | "viewed_explanation" | "started_practice" | "correct_first" | "correct_after_hint" | "correct_after_many_hints" | "revealed" | "correct_new_context";
const POINTS: Record<MasteryEvent, number> = {
  ai_completed: 10, viewed_explanation: 5, started_practice: 10, correct_first: 40,
  correct_after_hint: 25, correct_after_many_hints: 10, revealed: 0, correct_new_context: 25,
};
export function applyEvent(score: number, e: MasteryEvent): number { return Math.min(100, score + POINTS[e]); }
/** BUILD_SPEC 35: 0-29 NOT_STARTED, 30-59 PRACTICING, 60-89 PROFICIENT, 90-100 MASTERED. */
export function statusFor(score: number): SkillStatus {
  if (score >= 90) return "MASTERED"; if (score >= 60) return "PROFICIENT"; if (score >= 30) return "PRACTICING"; return "NOT_STARTED";
}
