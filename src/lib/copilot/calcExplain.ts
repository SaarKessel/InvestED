/** "How was this calculated": the fixed steps behind the projection card, matching calculatorEngine.computeProjection exactly. No model. */
import type { CalcDeskResult } from "./calcDesk";
import { DEFAULT_INFLATION_PCT } from "../calculatorEngine";

export interface CalcStepsInput { data: CalcDeskResult; money: (v: number) => string; language: "he" | "en" }
export function calcSteps({ data, money, language }: CalcStepsInput): string[] {
  const months = Math.max(0, Math.round(data.years * 12));
  const mr = (data.returnPct / 12).toFixed(4).replace(/\.?0+$/, "");
  if (language === "he") return [
    `נקודת התחלה: ${money(data.principal)}. הפקדה חודשית: ${money(data.monthly)}. תקופה: ${months} חודשים (${data.years} שנים).`,
    `תשואה שנתית לדוגמה (הנחת לימוד, לא תחזית): ${data.returnPct}%. בכל חודש משתמשים ב-${mr}% (השנתית חלקי 12).`,
    `כל חודש: היתרה כפול (1 + התשואה החודשית), ואז מוסיפים את ההפקדה החודשית. חוזרים על זה ${months} פעמים.`,
    `התוצאה אחרי ${months} חודשים: ${money(data.finalBalance)}. סך מה שהפקדתם: ${money(data.contributed)}. הצמיחה היא ההפרש: ${money(data.growth)}.`,
    `שווי ריאלי: התוצאה מחולקת ב-(1 + ${DEFAULT_INFLATION_PCT}%) בחזקת ${data.years}. אינפלציה של ${DEFAULT_INFLATION_PCT}% בשנה היא הנחת לימוד. התוצאה: ${money(data.real)}.`,
  ];
  return [
    `Start: ${money(data.principal)}. Monthly deposit: ${money(data.monthly)}. Period: ${months} months (${data.years} years).`,
    `Example yearly return (a teaching assumption, not a forecast): ${data.returnPct}%. Each month uses ${mr}% (the yearly rate divided by 12).`,
    `Each month: the balance times (1 + the monthly return), then the monthly deposit is added. This repeats ${months} times.`,
    `Result after ${months} months: ${money(data.finalBalance)}. Total you put in: ${money(data.contributed)}. Growth is the difference: ${money(data.growth)}.`,
    `Real value: the result divided by (1 + ${DEFAULT_INFLATION_PCT}%) to the power ${data.years}. Inflation of ${DEFAULT_INFLATION_PCT}% a year is a teaching assumption. Result: ${money(data.real)}.`,
  ];
}
/** Independent re-computation used by tests and the card's check line. */
export function recompute(d: Pick<CalcDeskResult, "principal" | "monthly" | "years" | "returnPct">): number {
  let b = d.principal; const r = d.returnPct / 100 / 12;
  for (let m = 0; m < Math.round(d.years * 12); m++) b = b * (1 + r) + d.monthly;
  return Math.round(b);
}
