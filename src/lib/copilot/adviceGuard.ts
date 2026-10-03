// InvestED - deterministic advice guard for model output (educational, not advice).
// Rejects "buy/sell now" directives, personalized position sizing and guaranteed-return
// language. Pure regex, no model call. On a hit the caller swaps in the disclaimer.

export type AdviceViolation = "directive" | "position_sizing" | "guaranteed_return";

export interface AdviceGuardResult {
  ok: boolean;
  violations: AdviceViolation[];
}

const RULES: Array<{ kind: AdviceViolation; patterns: RegExp[] }> = [
  {
    kind: "directive",
    patterns: [
      /\b(you\s+(?:(?:definitely|absolutely|really)\s+)?(should|must|need\s+to|ought\s+to)(\s+(definitely|absolutely|really|probably|just|consider))?|i\s+(recommend|suggest|advise)\s+(you\s+)?(to\s+)?|go\s+ahead\s+and|time\s+to)\s*(buy|sell|short|dump|load\s+up|purchase)/i,
      /\bload\s+up\s+on\b|\bdump\s+your\b/i,
      /\b(buy|sell|short)\s+(it\s+|them\s+|this\s+|that\s+|everything\s+|all\s+of\s+it\s+)?(now|today|immediately|right\s+away|asap)\b/i,
      /\bdon'?t\s+(wait|hesitate)\s*[,.-]?\s*(buy|sell)\b/i,
      /(כדאי\s+לך|עליך|אתה\s+חייב|את\s+חייבת|אני\s+ממליץ|אני\s+ממליצה)\s+(ל)?(קנות|מכור|למכור|לקנות|לשורט)/,
      /(תקנה|תקני|תמכור|תמכרי)\s+(עכשיו|היום|מיד|מייד)/,
      /מומלץ\s+(ל)?(קנות|מכור|למכור|לקנות)/,
      /(קנה|קני|מכור|מכרי)\s+(עכשיו|היום|מיד|מייד)/,
    ],
  },
  {
    kind: "position_sizing",
    patterns: [
      /\b(you\s+should|you\s+ought\s+to|i\s+(recommend|suggest)|put|invest|allocate|put\s+in)\s+(about\s+|around\s+|exactly\s+)?\d{1,3}(\.\d+)?\s?%\s+(of\s+your|in|into|to)\b/i,
      /\b(your|you)\s+(ideal|optimal|right|best)\s+(position\s+size|allocation|portfolio\s+mix)\s+(is|should\s+be)\b/i,
      /\b(put|invest|allocate)\s+(all|everything|your\s+(whole|entire)\s+(savings|portfolio)|all\s+(of\s+)?your\s+(money|savings|cash))\s+(in|into)\b/i,
      /(כדאי|עליך|תשקיע|תשקיעי|השקע|השקיעי|תקצה|תקצי)\s+(לך\s+)?(להשקיע\s+)?\d{1,3}(\.\d+)?\s?%\s+(מה|מתוך|ב)/,
      /(שים|שימי|תשים|תשימי)\s+את\s+כל\s+(הכסף|החסכונות)\s+ב/,
    ],
  },
  {
    kind: "guaranteed_return",
    patterns: [
      /(?<!\b(?:no\s+one|nobody|no\s+\w+|cannot|can't|can\s+not|never|not|isn't|aren't|don't|doesn't)\s+(?:\w+\s+){0,4})\bguarantee[sd]?\s+(you\s+)?(a\s+)?(\d+(\.\d+)?\s?%|profit|returns?|gains?|income)/i,
      /\b(risk[- ]free|no[- ]risk|can'?t\s+lose|can(?:no|\s+no)t\s+lose|sure\s+thing|sure\s+bet|certain\s+to\s+(rise|go\s+up|gain))\b/i,
      /(?<!\b(?:no\s+one|nobody|no\s+\w+|cannot|can't|can\s+not|never|not|isn't|aren't|don't|doesn't)\s+(?:\w+\s+){0,4})\b(will\s+definitely|is\s+guaranteed\s+to|certain(ly)?\s+will)\s+(rise|go\s+up|double|triple|gain|profit|return)/i,
      /(רווח|תשואה)\s+(מובטח|מובטחת|בטוח|בטוחה|ללא\s+סיכון)/,
      /בטוח\s+ש(?:תרוויח|תרוויחי|יעלה|תעלה)/,
      /(מובטח|מובטחת)\s+(רווח|תשואה)|ללא\s+סיכון|אי\s+אפשר\s+להפסיד|בלתי\s+אפשרי\s+להפסיד/,
    ],
  },
];

export function checkAdvice(text: string): AdviceGuardResult {
  const violations: AdviceViolation[] = [];
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) violations.push(rule.kind);
  }
  return { ok: violations.length === 0, violations };
}

export const ADVICE_DISCLAIMER_EN =
  "This is an educational simulation, not investment advice. I can explain how things work and what the numbers mean, but I can't tell you what to buy or sell, how much to invest, or promise any return. Investing carries risk, including loss of capital.";
export const ADVICE_DISCLAIMER_HE =
  "זו סימולציה לימודית ולא ייעוץ השקעות. אפשר להסביר איך דברים עובדים ומה המספרים אומרים, אבל לא להגיד מה לקנות או למכור, כמה להשקיע, או להבטיח תשואה. בהשקעות יש סיכון, כולל הפסד הון.";

export function adviceDisclaimer(text: string): string {
  return /[\u0590-\u05FF]/.test(text) ? ADVICE_DISCLAIMER_HE : ADVICE_DISCLAIMER_EN;
}

/** Returns the text to show: original when clean, the disclaimer when not. */
export function applyAdviceGuard(text: string): { text: string; guarded: boolean; violations: AdviceViolation[] } {
  const result = checkAdvice(text);
  if (result.ok) return { text, guarded: false, violations: [] };
  return { text: adviceDisclaimer(text), guarded: true, violations: result.violations };
}
