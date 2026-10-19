import type { Action } from "@/features/gapsheet/types/actions";

export interface Explanation {
  summary: string;
  whatChanged: string[];
  excelEquivalent?: string;
  concept?: string;
  whyItWorks?: string;
}

/** What an intent provider may return. It proposes; the executor decides. */
export type IntentResult =
  | { kind: "action"; actions: Action[]; skillId: SkillId; confidence: number; stages: string[]; focus: string; header?: string }
  | { kind: "clarification"; question: string; options: string[]; notUnderstood?: boolean }
  | { kind: "unsupported"; message: string };

export type SkillId = "sum" | "average" | "sorting" | "filtering" | "if" | "min" | "max" | "count" | "sumif" | "countif" | "dedupe" | "dates" | "sumifs" | "iferror" | "text" | "pivot" | "xlookup" | "indexmatch" | "none";
