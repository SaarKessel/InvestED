// Step-by-step plain-language explanation of each indicator rule (he/en).
// Educational: describes what the number means, never says what to buy or sell.

import type { Rule } from "./rules.js";

export interface RuleExplanation {
  title: { en: string; he: string };
  steps: Array<{ en: string; he: string }>;
}

export function explainRule(rule: Rule): RuleExplanation {
  switch (rule.kind) {
    case "rsi_below":
    case "rsi_above": {
      const below = rule.kind === "rsi_below";
      const n = rule.period;
      const l = rule.level;
      return {
        title: { en: `RSI(${n}) ${below ? "below" : "above"} ${l}`, he: `RSI(${n}) ${below ? "מתחת ל-" : "מעל "}${l}` },
        steps: [
          { en: `Look at the last ${n} price changes between closes.`, he: `מסתכלים על ${n} השינויים האחרונים בין מחירי סגירה.` },
          { en: "Average the gains and the losses separately (Wilder smoothing gives recent days a little more weight).", he: "מחשבים ממוצע לעליות וממוצע לירידות בנפרד (החלקת ווילדר נותנת לימים האחרונים קצת יותר משקל)." },
          { en: "RSI = 100 - 100 / (1 + average gain / average loss). It always lands between 0 and 100.", he: "RSI = 100 - 100 / (1 + ממוצע עליות / ממוצע ירידות). התוצאה תמיד בין 0 ל-100." },
          { en: `The rule is true on a day when RSI is ${below ? "under" : "over"} ${l}. ${below ? "Low RSI means recent falls were stronger than recent rises." : "High RSI means recent rises were stronger than recent falls."} It describes the past, it does not predict.`, he: `הכלל מתקיים ביום שבו RSI ${below ? "נמוך מ" : "גבוה מ"}-${l}. ${below ? "RSI נמוך אומר שהירידות האחרונות היו חזקות מהעליות." : "RSI גבוה אומר שהעליות האחרונות היו חזקות מהירידות."} זה מתאר את העבר ולא חוזה את העתיד.` },
        ],
      };
    }
    case "macd_cross_up":
    case "macd_cross_down": {
      const up = rule.kind === "macd_cross_up";
      return {
        title: { en: `MACD(${rule.fast},${rule.slow},${rule.signal}) crosses ${up ? "up" : "down"}`, he: `MACD(${rule.fast},${rule.slow},${rule.signal}) חוצה ${up ? "כלפי מעלה" : "כלפי מטה"}` },
        steps: [
          { en: `Compute two exponential averages of the close: fast (${rule.fast}) and slow (${rule.slow}). Recent days count more.`, he: `מחשבים שני ממוצעים אקספוננציאליים של הסגירה: מהיר (${rule.fast}) ואיטי (${rule.slow}). לימים האחרונים יש יותר משקל.` },
          { en: "MACD line = fast average minus slow average.", he: "קו MACD = הממוצע המהיר פחות האיטי." },
          { en: `Signal line = a ${rule.signal}-period average of the MACD line.`, he: `קו האות = ממוצע של ${rule.signal} תקופות של קו MACD.` },
          { en: `The rule fires only on the day the MACD line moves ${up ? "above" : "below"} the signal line, after being on the other side the day before.`, he: `הכלל מופעל רק ביום שבו קו MACD עובר ${up ? "מעל" : "מתחת"} לקו האות, אחרי שביום הקודם היה בצד השני.` },
        ],
      };
    }
    case "sma_cross_up":
    case "sma_cross_down":
    case "ema_cross_up":
    case "ema_cross_down": {
      const up = rule.kind.endsWith("up");
      const ema = rule.kind.startsWith("ema");
      const name = ema ? "EMA" : "SMA";
      return {
        title: { en: `${name}(${rule.fast}) crosses ${up ? "above" : "below"} ${name}(${rule.slow})`, he: `${name}(${rule.fast}) חוצה ${up ? "מעל " : "מתחת ל-"}${name}(${rule.slow})` },
        steps: [
          { en: ema ? `Fast average: exponential average of the last ${rule.fast} closes (recent days weigh more).` : `Fast average: the plain average of the last ${rule.fast} closes.`, he: ema ? `ממוצע מהיר: ממוצע אקספוננציאלי של ${rule.fast} הסגירות האחרונות (לימים האחרונים יש יותר משקל).` : `ממוצע מהיר: ממוצע פשוט של ${rule.fast} הסגירות האחרונות.` },
          { en: ema ? `Slow average: the same, over ${rule.slow} closes.` : `Slow average: the plain average of the last ${rule.slow} closes.`, he: ema ? `ממוצע איטי: אותו חישוב על ${rule.slow} סגירות.` : `ממוצע איטי: ממוצע פשוט של ${rule.slow} הסגירות האחרונות.` },
          { en: `The rule fires only on the day the fast average moves ${up ? "above" : "below"} the slow one, after being on the other side the day before.`, he: `הכלל מופעל רק ביום שבו הממוצע המהיר עובר ${up ? "מעל" : "מתחת"} לאיטי, אחרי שביום הקודם היה בצד השני.` },
        ],
      };
    }
  }
}
