/**
 * Phase 3 (H4): the learning path inside chat. Deterministic routing; the
 * stages are the site's own LEARNING_ROADMAP content, shown verbatim.
 */
import { LEARNING_ROADMAP } from "../educationContent";

export function looksLikeLearningPathRequest(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return /learning (?:path|roadmap|plan)|study (?:plan|path)|roadmap|where (?:do i|should i|can i|to) (?:start|begin)|how (?:do i|should i|can i) (?:start|begin|learn)|teach me (?:how )?(?:to )?invest|learn (?:to |about )?invest|(?:(?:want|like) to|wanna) start invest(?:ing)?|beginner|how to (?:start|begin) invest|(?:i'?m|i am) (?:a )?(?:total |complete )?(?:new to invest|newbie)|what (?:should i|do i|to) learn first/.test(t)
    || /מפת דרכים|מסלול ל?(?:לימוד|למידה)|תוכנית (?:לימוד|למידה)|מאיפה (?:להתחיל|מתחילים)|איפה (?:להתחיל|מתחילים)|איך (?:מתחיל|להתחיל|אני מתחיל)|(?:ללמוד|לומדים) (?:להשקיע|על השקעות)|תלמד(?:י)? אותי|מתחיל(?:ה)?(?![א-ת])|אני חדש(?:ה)? (?:ב|בעולם )ה?השקעות|(?:אני רוצה|בא לי|רוצה) להתחיל (?:להשקיע|לחסוך)|מה (?:כדאי )?ללמוד (?:קודם|ראשון)/.test(t);
}

export interface LearnDeskStage { stage: string; title: string; topics: string[] }

type Localized<T> = T | { he: T; en: T };
function pick<T>(v: Localized<T>, language: "he" | "en"): T {
  return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as { he: T; en: T })[language] : (v as T);
}

export function buildLearningPath(language: "he" | "en"): LearnDeskStage[] {
  return LEARNING_ROADMAP.map((s) => ({
    stage: pick<string>(s.stage, language),
    title: pick<string>(s.title, language),
    topics: pick<string[]>(s.topics, language),
  }));
}
