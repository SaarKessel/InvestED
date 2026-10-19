import type { LearnableSkill } from "./curriculum";
import { pick, type Lang } from "@/features/gapsheet/lib/i18n";

/** Level -> required skills -> proficiency threshold (transformation spec 14, framed by level at the owner's request). New levels are data, not code. The type keeps the name Role for compatibility.
 *  `soon` lists skills the role needs that the product cannot teach or verify yet. They are shown honestly and never counted in the score. */
export interface Requirement { skill: LearnableSkill; threshold: number; /** relative weight, > 0 */ weight: number; /** why this skill is required for the profile (shown to the user) */ why: string }
export interface ProfileSource { label: string; date: string; url?: string }
/** A profile is data: it must name its source and date. A level map is a fit to a profile, never a promise about a job. */
export interface Role { id: string; he: string; en: string; source: ProfileSource; required: Requirement[]; soon: string[] }
const R = (skills: LearnableSkill[], threshold: number, why = "Part of the GapSheet level map for this level."): Requirement[] => skills.map((skill) => ({ skill, threshold, weight: 1, why }));
/** Honest provenance: these three are GapSheet's own level map, not validated against employers or job descriptions. Job-role profiles need external sources first. */
const SRC: ProfileSource = { label: "GapSheet internal skill-level map (not externally validated)", date: "2026-10-09" };
const BASIC: LearnableSkill[] = ["sum", "average", "min", "max", "count"];
const MID: LearnableSkill[] = ["if", "sumif", "countif", "sorting", "filtering"];
const ADV: LearnableSkill[] = ["sumifs", "iferror", "text", "dates", "dedupe", "pivot", "xlookup", "indexmatch"];
export const ROLES: Role[] = [
  { id: "basic", he: "בסיסי", en: "Basic", source: SRC, soon: [], required: R(BASIC, 60) },
  { id: "intermediate", he: "בינוני", en: "Intermediate", source: SRC, soon: [], required: R([...BASIC, ...MID], 60) },
  { id: "advanced", he: "מתקדם", en: "Advanced", source: SRC, soon: ["Power Query"], required: R([...BASIC, ...MID, ...ADV], 90) },
];

/** Job profiles (owner approved 2-3 roles, 9.10.2026). Evidence: O*NET OnLine occupation pages (task importance 0-100, "Hot Technology" flags), read 2026-10-09.
 *  HONEST LIMIT: O*NET lists tasks, not Excel functions. Which skill serves which task, and every weight, is GapSheet's own judgment. It is NOT validated with practitioners or employers.
 *  Weight 3 = tied to a task with importance >= 80 or an explicit spreadsheet task; 2 = tied to a task rated 70-79; 1 = supporting. */
const onet = (code: string, name: string): ProfileSource => ({ label: `O*NET OnLine ${code} ${name}. Skill mapping and weights: GapSheet judgment, not validated with practitioners`, date: "2026-10-09", url: `https://www.onetonline.org/link/summary/${code}` });
const W = (skill: LearnableSkill, weight: number, he: string, en: string, threshold = 60): Requirement => ({ skill, threshold, weight, why: `${he} / ${en}` });
export const JOB_ROLES: Role[] = [
  { id: "bookkeeper", he: "מנהל/ת חשבונות", en: "Bookkeeping clerk", soon: ["Reconciling against bank files (import)", "Payroll templates"], source: onet("43-3031.00", "Bookkeeping, Accounting, and Auditing Clerks"), required: [
    W("sum", 3, "סיכום חשבונות בגיליון (משימה בחשיבות 79)", "Total accounts on spreadsheets (task importance 79)"),
    W("average", 1, "חישובים פיננסיים כלליים", "General financial calculations"),
    W("if", 2, "בדיקת תנאי תשלום ויתרות", "Checking payment status and balances"),
    W("sumif", 3, "סיכום לפי חשבון או ספק (התאמות, חשיבות 87)", "Totals per account or vendor (reconciliation, importance 87)"),
    W("countif", 2, "ספירת רשומות תואמות", "Counting matching records"),
    W("sorting", 1, "סידור פנקסים ורשימות", "Ordering ledgers and lists"),
    W("dedupe", 2, "איתור כפילויות ברשומות (התאמה, חשיבות 82)", "Finding duplicate records (reconciliation, importance 82)"),
    W("xlookup", 3, "התאמת הזמנות לחשבוניות (חשיבות 78)", "Matching order forms to invoices (importance 78)"),
    W("dates", 1, "תאריכי פירעון", "Due dates"),
  ] },
  { id: "analyst", he: "אנליסט/ית פיננסי/ת", en: "Financial analyst", soon: ["Power Query", "Charts from sheet data"], source: onet("13-2051.00", "Financial and Investment Analysts"), required: [
    W("sum", 1, "בסיס לכל חישוב", "Foundation of every calculation"),
    W("average", 2, "ממוצעים ומדדי ביצוע", "Averages and performance measures"),
    W("if", 2, "תרחישים ותנאים", "Scenarios and conditions"),
    W("sumifs", 3, "סיכום לפי כמה תנאים (ניתוח ביצועים)", "Multi-condition totals (performance analysis)"),
    W("pivot", 3, "סיכום נתונים לדוחות (Excel מסומן כטכנולוגיה מבוקשת ב-O*NET)", "Summarizing data for reports (Excel is a flagged Hot Technology in O*NET)"),
    W("indexmatch", 2, "חיפוש גמיש בטבלאות נתונים", "Flexible lookups in data tables"),
    W("xlookup", 2, "חיפוש בטבלאות", "Table lookups"),
    W("iferror", 2, "דוחות נקיים משגיאות", "Error-free reports"),
    W("dates", 2, "סדרות זמן ותקופות", "Time series and periods"),
    W("text", 1, "ניקוי נתונים מיובאים", "Cleaning imported data"),
  ].map((r) => ({ ...r, threshold: 70 })) },
  { id: "accountant", he: "רואה/ת חשבון", en: "Accountant or auditor", soon: ["Journal entry templates", "Tax tables"], source: onet("13-2011.00", "Accountants and Auditors"), required: [
    W("sum", 2, "בסיס לבדיקות ודוחות", "Basis for checks and reports"),
    W("if", 2, "בדיקות עמידה בכללים", "Rule compliance checks"),
    W("sumif", 3, "התאמת חשבונות והפרשים (חשיבות 87)", "Account reconciliation and differences (importance 87)"),
    W("sumifs", 2, "סיכום לפי כמה תנאים בדוחות", "Multi-condition totals in reports"),
    W("countif", 2, "זיהוי חריגים וכפילויות (חשיבות 75)", "Detecting outliers and duplicated effort (importance 75)"),
    W("dedupe", 3, "איתור כפילות ומאמץ כפול בבקרה (חשיבות 75)", "Finding duplicates in controls testing (importance 75)"),
    W("xlookup", 2, "התאמת רשומות בין מקורות", "Matching records across sources"),
    W("iferror", 1, "דוחות ביקורת נקיים משגיאות", "Audit reports free of errors"),
    W("pivot", 2, "סיכום נתוני ביקורת (חשיבות 74)", "Summarizing audit data (importance 74)"),
  ].map((r) => ({ ...r, threshold: 70 })) },
];
/** Level maps first, then job profiles. */
export const ALL_PROFILES: Role[] = [...ROLES, ...JOB_ROLES];
export const roleName = (r: Role, lang: Lang) => pick(lang, r.he, r.en);

export interface Readiness { overall: number; met: number; total: number; gaps: { skill: LearnableSkill; score: number; threshold: number }[]; soon: string[] }
export interface ReadinessRow { skill: LearnableSkill; score: number; threshold: number; weight: number; ratio: number; share: number; why: string }
/** Weighted and transparent: ratio = min(score/threshold, 1); share = ratio x weight / total weight x 100; overall = sum of shares. Scores are derived from verified evidence (G2). */
export function readinessDetail(role: Role, scores: Record<string, number>): { overall: number; rows: ReadinessRow[]; totalWeight: number } {
  const totalWeight = role.required.reduce((a, r) => a + r.weight, 0);
  const rows = role.required.map((r) => { const score = scores[r.skill] ?? 0; const ratio = Math.min(score / r.threshold, 1); return { skill: r.skill, score, threshold: r.threshold, weight: r.weight, ratio, share: totalWeight ? (ratio * r.weight / totalWeight) * 100 : 0, why: r.why }; });
  return { overall: Math.round(rows.reduce((a, r) => a + r.share, 0)), rows, totalWeight };
}
export function readiness(role: Role, scores: Record<string, number>): Readiness {
  const d = readinessDetail(role, scores);
  const gaps = d.rows.filter((p) => p.score < p.threshold).sort((a, b) => a.ratio - b.ratio);
  return { overall: d.overall, met: d.rows.length - gaps.length, total: d.rows.length, gaps: gaps.map(({ skill, score, threshold }) => ({ skill, score, threshold })), soon: role.soon };
}
/** Returns the names of the invalid fields. A profile without a source, date, rationale or positive weight must not be shown. */
export function validateProfile(r: Role): string[] {
  const e: string[] = [];
  if (!r.source) e.push("source"); else { if (!r.source.label?.trim()) e.push("source.label"); if (!/^\d{4}-\d{2}-\d{2}$/.test(r.source.date ?? "")) e.push("source.date"); }
  if (!r.required?.length) e.push("required");
  r.required?.forEach((q, i) => { if (!q.why?.trim()) e.push(`required[${i}].why`); if (!(q.weight > 0)) e.push(`required[${i}].weight`); if (!(q.threshold > 0 && q.threshold <= 100)) e.push(`required[${i}].threshold`); });
  return e;
}
