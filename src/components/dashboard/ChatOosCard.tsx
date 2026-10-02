import { useLanguage } from "@/context/languageContext";
import type { OosDeskResult } from "@/lib/copilot/oosDesk";

const n1 = (x: number | null) => (x === null ? "-" : x.toFixed(2));
const p1 = (x: number) => `${x >= 0 ? "+" : ""}${x.toFixed(1)}%`;
const NAMES = { min_variance: { en: "Minimum variance", he: "שונות מינימלית" }, max_sharpe: { en: "Max Sharpe", he: "שארפ מקסימלי" }, equal_weight: { en: "Equal weight", he: "משקל שווה" }, spy: { en: "SPY", he: "SPY" } } as const;

/** Out-of-sample check: weights learned on the first 70% of real history, judged on the last 30% it never saw. Educational simulation, not advice. */
export function ChatOosCard({ data }: { data: OosDeskResult }) {
  const { language } = useLanguage();
  const he = language === "he";
  const l = he ? "he" : "en";
  const o = data.outcome;
  const reasonText = !o.ok ? (
    o.reason === "too_few_assets" || o.reason === "too_many_assets" ? (he ? "כתבו בין 2 ל-5 סימולים, למשל: \"האם תיק AAPL KO MSFT שעבר אופטימיזציה מחזיק מחוץ למדגם?\"" : "Write 2 to 5 tickers, for example: \"does an optimized AAPL KO MSFT portfolio hold up out of sample?\"")
    : o.reason === "spy_missing" ? (he ? "אין לי עכשיו מחירי SPY אמיתיים להשוואה, ולכן לא מחשבת." : "I have no real SPY prices to compare with right now, so I am not computing this.")
    : data.unavailable.length > 0 ? (he ? `אין לי היסטוריית מחירים אמיתית עבור: ${data.unavailable.join(", ")}. לא אנחש.` : `I have no real price history for: ${data.unavailable.join(", ")}. I will not guess.`)
    : (he ? "אין מספיק היסטוריה משותפת (צריך לפחות כ-400 ימי מסחר, ו-100 לפחות לחלק המבחן)." : "There is not enough shared history (about 400 trading days are needed, at least 100 for the test part).")
  ) : null;
  const r = o.ok ? o.result : null;
  const verdict = r ? ({
    held_up: he ? "המשקלים שנלמדו שמרו על איכות גם על נתונים חדשים." : "The learned weights kept their quality on new data.",
    degraded: he ? "האיכות ירדה ברור על נתונים חדשים, ונוצרה התאמת יתר לעבר." : "Quality dropped clearly on new data, a sign of overfitting to the past.",
    mixed: he ? "תמונה מעורבת: חלק מהיתרון נשמר וחלק נעלם." : "A mixed picture: some of the edge stayed and some vanished.",
    unclear: he ? "אי אפשר לקבוע, חסר מדד." : "Cannot tell, a measure is missing.",
  } as const)[r.verdict] : null;
  return (
    <div className="mt-3 rounded-lg border-2 border-dashed border-amber-500/70 bg-background/70 p-3 text-xs" data-testid="oos-card">
      <p className="font-semibold">{he ? "בדיקה מחוץ למדגם" : "Out-of-sample check"}{r && <span dir="ltr"> · {r.symbols.join(", ")}</span>}</p>
      <p className="mt-1 font-bold text-amber-700 dark:text-amber-300">{he ? "סימולציה לימודית, לא ייעוץ השקעות" : "Educational simulation, not investment advice"}</p>
      {reasonText && <p className="mt-2" role="status">{reasonText}</p>}
      {r && (
        <div className="mt-2" data-testid="oos-result">
          <p className="text-muted-foreground" dir="ltr">{he ? "אימון" : "Train"} {r.from} → {r.splitDate} ({r.trainDays}d) · {he ? "מבחן, נתונים שלא נראו" : "Test, never seen"} {r.splitDate} → {r.to} ({r.testDays}d)</p>
          <div className="mt-2 overflow-x-auto" dir="ltr">
            <table className="w-full text-start">
              <thead className="text-muted-foreground"><tr><th className="pe-3 text-start font-medium">{he ? "תיק" : "Portfolio"}</th><th className="pe-3 text-end font-medium">Sharpe {he ? "אימון" : "train"}</th><th className="pe-3 text-end font-medium">Sharpe {he ? "מבחן" : "test"}</th><th className="pe-3 text-end font-medium">{he ? "תשואה במבחן" : "Test return"}</th><th className="text-end font-medium">{he ? "ירידה מקס'" : "Max drop"}</th></tr></thead>
              <tbody>{r.rows.map((x) => <tr key={x.name} className="border-t border-border/50"><td className="py-1 pe-3">{NAMES[x.name][l]}</td><td className="pe-3 text-end">{n1(x.train.sharpe)}</td><td className="pe-3 text-end">{n1(x.test.sharpe)}</td><td className="pe-3 text-end">{p1(x.test.totalReturnPct)}</td><td className="text-end">{x.test.maxDrawdownPct.toFixed(1)}%</td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-2 text-muted-foreground" dir="ltr">{he ? "משקלים שנלמדו באימון: " : "Weights learned on train: "}{r.symbols.map((s, i) => `${s} ${(((r.rows[0].weights?.[i] ?? 0)) * 100).toFixed(0)}% / ${(((r.rows[1].weights?.[i] ?? 0)) * 100).toFixed(0)}%`).join(" · ")} <span>({he ? "שונות מינימלית / שארפ מקסימלי" : "min variance / max Sharpe"})</span></p>
          <p className="mt-2 font-medium" data-testid="oos-verdict">{verdict}{r.sharpeDropMaxSharpe !== null && <span dir="ltr"> (Sharpe {r.sharpeDropMaxSharpe >= 0 ? "-" : "+"}{Math.abs(r.sharpeDropMaxSharpe).toFixed(2)})</span>}</p>
        </div>
      )}
      <ul className="mt-2 list-disc space-y-0.5 ps-5 text-muted-foreground">
        <li>{he ? "המשקלים נלמדו רק מ-70% הראשונים של ההיסטוריה האמיתית, והבדיקה נעשית על 30% האחרונים." : "Weights were learned only from the first 70% of real history and judged on the last 30%."}</li>
        <li>{he ? "תשואות מחיר יומיות בלבד, בלי דיבידנדים, עמלות ומסים. שארפ לפי ריבית אפס. העבר לא מבטיח עתיד." : "Daily price returns only, no dividends, costs or taxes. Sharpe uses a zero risk-free rate. The past does not promise the future."}</li>
      </ul>
    </div>
  );
}
