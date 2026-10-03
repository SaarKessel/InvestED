/**
 * A long question with several calculations: split it into parts, run each part through the
 * fixed engines (calculator, math parser, loan payment) and show every result in order.
 * A part that cannot be read deterministically is listed as not calculated, never guessed.
 */
import { runCalcDesk, type CalcDeskResult } from "./calcDesk";
import { runMathDesk, type MathDeskResult } from "./mathDesk";

export type ScenarioPart =
  | { kind: "calc"; text: string; calc: CalcDeskResult }
  | { kind: "math"; text: string; math: MathDeskResult }
  | { kind: "skipped"; text: string };

const SPLIT = /(?<=[.!?؟])\s+|;\s*|\n+|\s+(?:and then|then|after that|also|next)\s+|\s+(?:ואז|ואחר כך|אחרי זה|וגם)\s+/i;
const LOAN = /(?:loan|mortgage|הלוואה|משכנתא)/i;

/** "loan of 200000 at 5% for 30 years" becomes the same pmt(...) expression a user could type. */
export function loanExpression(text: string): string | null {
  if (!LOAN.test(text)) return null;
  const pct = /(\d+(?:\.\d+)?)\s*%/.exec(text)?.[1];
  const years = /(\d+(?:\.\d+)?)\s*-?\s*(?:years?|yrs?|שנה|שנים|שנות)|ל-?\s*(\d+)\s*שנ/i.exec(text);
  const y = years?.[1] ?? years?.[2];
  const rest = text.replace(/(\d+(?:\.\d+)?)\s*%/g, " ").replace(/(\d+(?:\.\d+)?)\s*-?\s*(?:years?|yrs?|שנה|שנים|שנות)|ל-?\s*\d+\s*שנ\S*/gi, " ");
  const amt = /(\d[\d,]*(?:\.\d+)?)\s*(k\b|m\b|thousand|million|אלף|מיליון)?/i.exec(rest);
  if (!pct || !y || !amt) return null;
  const unit = amt[2]?.toLowerCase();
  const scale = unit === "m" || unit === "million" || unit === "מיליון" ? 1_000_000 : unit ? 1000 : 1;
  const a = Number(amt[1].replace(/,/g, "")) * scale;
  return a > 0 ? `pmt(${a}, ${pct}, ${y})` : null;
}

export function runScenario(text: string): ScenarioPart[] | null {
  const pieces = text.split(SPLIT).map((s) => s.trim().replace(/^(?:and then|and|then|also|next|after that|ואז|וגם|ואחר כך)\s+/i, "").replace(/[.!?؟]+$/, "")).filter((s) => /\d/.test(s));
  if (pieces.length < 2 || pieces.length > 6) return null;
  const parts: ScenarioPart[] = pieces.map((p): ScenarioPart => {
    const loan = loanExpression(p);
    if (loan) { const m = runMathDesk(loan); if (m?.ok) return { kind: "math", text: p, math: m }; }
    const calc = runCalcDesk(p);
    if (calc) return { kind: "calc", text: p, calc };
    const math = runMathDesk(p);
    if (math) return math.ok ? { kind: "math", text: p, math } : { kind: "skipped", text: p };
    return { kind: "skipped", text: p };
  });
  return parts.filter((p) => p.kind !== "skipped").length >= 2 ? parts : null;
}
