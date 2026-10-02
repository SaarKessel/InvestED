import { useState } from "react";
import { rentVsBuy, sensitivity, validateInputs, RENT_BUY_FIELDS, type RentBuyInputs } from "@/lib/lessons/rentVsBuy";
import { Edu, Num, Section } from "./shared";
import { parseNum } from "./sharedUtil";

const LABELS: Record<keyof RentBuyInputs, [string, string]> = {
  homePrice: ["Home price", "מחיר הדירה"], downPayment: ["Down payment", "הון עצמי"], mortgageRatePct: ["Mortgage rate, % a year", "ריבית משכנתא, % בשנה"],
  mortgageYears: ["Mortgage years", "שנות משכנתא"], ownCostPct: ["Yearly cost of owning, % of price", "עלות החזקה שנתית, % ממחיר הדירה"], homeGrowthPct: ["Home price growth, % a year (your assumption)", "עליית מחיר דירה, % בשנה (ההנחה שלכם)"],
  monthlyRent: ["Monthly rent", "שכר דירה חודשי"], rentGrowthPct: ["Rent growth, % a year", "עליית שכירות, % בשנה"], investReturnPct: ["Return on invested money, % a year (your assumption)", "תשואה על כסף מושקע, % בשנה (ההנחה שלכם)"],
  years: ["Years to compare", "שנים להשוואה"], sellCostPct: ["Selling cost, % of price", "עלות מכירה, % ממחיר"],
};
export function RentBuyLab({ he }: { he: boolean }) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const parsed: Partial<RentBuyInputs> = {};
  for (const k of RENT_BUY_FIELDS) { const n = parseNum(vals[k] ?? ""); if (n !== null) parsed[k] = n; }
  const ready = validateInputs(parsed);
  const result = ready ? rentVsBuy(parsed as RentBuyInputs) : null;
  const money = (n: number) => Math.round(n).toLocaleString(he ? "he-IL" : "en-US");
  const sens = ready ? (["homeGrowthPct", "investReturnPct"] as const).map((f) => sensitivity(parsed as RentBuyInputs, f, 1)) : [];
  return (
    <Section title={he ? "מעבדת שכירות מול קנייה" : "Rent-vs-buy lab"}>
      <p className="text-sm">{he ? "אין כאן ברירות מחדל: מלאו את ההנחות שלכם. בשני המסלולים מוציאים אותו סכום מזומן בחודש, ומי שמוציא פחות משקיע את ההפרש." : "There are no presets: fill in your own assumptions. Both paths spend the same cash each month, and whoever spends less invests the difference."}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {RENT_BUY_FIELDS.map((k) => <Num key={k} label={LABELS[k][he ? 1 : 0]} value={vals[k] ?? ""} set={(v) => setVals({ ...vals, [k]: v })} />)}
      </div>
      {!ready && <p role="status" className="text-sm text-muted-foreground">{he ? "מלאו את כל השדות בערכים הגיוניים כדי לראות תוצאה." : "Fill every field with sensible values to see a result."}</p>}
      {result && (
        <div className="space-y-2 text-sm" data-testid="rentbuy-result">
          <p>{he ? "תשלום משכנתא חודשי" : "Monthly mortgage payment"}: <b dir="ltr">{money(result.monthlyPayment)}</b></p>
          <p data-testid="breakeven">{result.breakEvenYear !== null ? (he ? `בהנחות שלכם, קנייה עוקפת את שכירות בשנה ${result.breakEvenYear}.` : `With your assumptions, owning pulls ahead of renting in year ${result.breakEvenYear}.`) : (he ? "בהנחות שלכם, קנייה לא עוקפת בטווח שבחרתם." : "With your assumptions, owning does not pull ahead within your horizon.")}</p>
          <div className="max-h-56 overflow-auto" dir="ltr"><table className="w-full text-xs"><thead><tr><th className="text-start">{he ? "שנה" : "Year"}</th><th className="text-end">{he ? "הון בדירה" : "Home equity"}</th><th className="text-end">{he ? "השקעות הבעלים" : "Owner investments"}</th><th className="text-end">{he ? "השקעות השוכר" : "Renter investments"}</th></tr></thead>
            <tbody>{result.rows.map((r) => <tr key={r.year} className="border-t border-border/50"><td>{r.year}</td><td className="text-end">{money(r.homeEquity)}</td><td className="text-end">{money(r.ownerExtraInvested)}</td><td className="text-end">{money(r.liquidInvestments)}</td></tr>)}</tbody></table></div>
          <p className="font-medium">{he ? "רגישות: מה קורה אם ההנחה זזה באחוז אחד" : "Sensitivity: what if one assumption moves by 1 point"}</p>
          <ul className="list-disc ps-5">{sens.map((s) => { const be = (r: typeof s.base) => (r?.breakEvenYear ?? (he ? "אין" : "none")); return <li key={s.field}>{LABELS[s.field][he ? 1 : 0]}: −1 → {be(s.down)} · {he ? "בסיס" : "base"} → {be(s.base)} · +1 → {be(s.up)} ({he ? "שנת עקיפה" : "break-even year"})</li>; })}</ul>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{he ? "לא כולל מיסים, מס רכישה או כללי מס כלשהם, ואין כאן תשואות מוכנות מראש. אלה לא נתוני שוק." : "No taxes, purchase tax or tax rules are included, and no returns are preset. These are not market data."}</p>
      <Edu he={he} />
    </Section>
  );
}
