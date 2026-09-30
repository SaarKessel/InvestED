/**
 * Phase 3 (H4): the learning path inside chat. Deterministic routing; the
 * stages are the site's own LEARNING_ROADMAP content, shown verbatim.
 */
import { LEARNING_ROADMAP } from "../educationContent";

export function looksLikeLearningPathRequest(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return /learning (?:path|roadmap|plan)|study (?:plan|path)|roadmap|where (?:do i|should i) (?:start|begin)|how (?:do i|should i|can i) (?:start|begin|learn)|teach me (?:to )?invest|learn (?:to )?invest|beginner/.test(t)
    || /מפת דרכים|מסלול (?:לימוד|למידה)|תוכנית (?:לימוד|למידה)|מאיפה (?:להתחיל|מתחילים)|איפה (?:להתחיל|מתחילים)|איך (?:מתחיל|להתחיל|אני מתחיל)|ללמוד (?:להשקיע|על השקעות)|תלמד(?:י)? אותי|מתחיל(?:ה)?\b/.test(t);
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
