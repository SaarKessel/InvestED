import { useState } from "react";
import { useLanguage } from "@/context/languageContext";
import { fetchNews } from "@/lib/newsClient";
import type { AssetResearch } from "@/lib/research/assetResearchEngine";
import { fetchDebate, type Debate } from "@/lib/research/investmentDebate";
import { buildBriefFacts, type BriefFacts } from "@/lib/research/scenarioBrief";

type State = { facts: BriefFacts; debate: Debate | null } | null;

/** Educational committee debate: bull and bear read the same engine facts, then what would change the picture. No verdict, ever. */
export function InvestmentDebateSection({ research }: { research: AssetResearch }) {
  const { language } = useLanguage();
  const he = language === "he";
  const [state, setState] = useState<State>(null);
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    let headlines: { title: string; publishedAt: string }[] = [];
    try {
      const n = await fetchNews();
      if (n.available) headlines = n.items.filter((i) => i.symbols.includes(research.symbol)).map((i) => ({ title: i.title, publishedAt: i.publishedAt }));
    } catch { /* news stays unavailable and is listed as such */ }
    const facts = buildBriefFacts(research, headlines);
    setState({ facts, debate: await fetchDebate(facts, he ? "he" : "en") });
    setBusy(false);
  }
  const list = (items: string[]) => <ul className="mt-1 list-disc space-y-1 ps-5 text-sm leading-6">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
  return (
    <section className="rounded-2xl border border-border bg-card p-5" aria-label={he ? "ועדת השקעות: ויכוח לימודי" : "Investment committee debate"} data-testid="investment-debate">
      <h3 className="font-bold">{he ? "ועדת השקעות: ויכוח לימודי" : "Investment committee debate"}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{he ? "צד אופטימי וצד זהיר מתווכחים רק על הנתונים שהמערכת החזירה. אין כאן המלצה או פסק דין, רק שיעור בחשיבה משני הצדדים. הניסוח הוא הערכת בינה מלאכותית, לא ייעוץ השקעות." : "An optimistic and a cautious analyst argue only from the numbers the engine returned. There is no recommendation and no verdict, only a lesson in thinking from both sides. The wording is an AI estimate, not investment advice."}</p>
      <button type="button" onClick={() => void run()} disabled={busy} className="mt-4 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{busy ? (he ? "טוען..." : "Loading...") : (he ? "הפעל את הוועדה" : "Run the committee")}</button>
      {state && (state.debate ? (
        <div className="mt-4 space-y-3" data-testid="debate-result">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-muted/40 p-3"><p className="text-sm font-bold">{he ? "הצד האופטימי" : "The bull case"}</p>{list(state.debate.bull)}</div>
            <div className="rounded-xl bg-muted/40 p-3"><p className="text-sm font-bold">{he ? "הצד הזהיר" : "The bear case"}</p>{list(state.debate.bear)}</div>
          </div>
          {state.debate.risk && <p className="text-sm"><b>{he ? "סיכון מרכזי: " : "Main risk: "}</b>{state.debate.risk}</p>}
          <div><p className="text-sm font-bold">{he ? "מה היה משנה את התמונה" : "What would change my mind"}</p>{list(state.debate.changeMyMind)}</div>
          <p className="text-xs text-muted-foreground">{he ? "הוועדה לא מחליטה. ההחלטה, אם בכלל, שלכם." : "The committee does not decide. Any decision is yours."}</p>
        </div>
      ) : <p className="mt-4 text-sm text-muted-foreground" role="status">{he ? "לא הצלחתי לכתוב ויכוח מאומת מהנתונים עכשיו, ולכן לא מוצג כלום." : "I could not write a verified debate from the data right now, so nothing is shown."}</p>)}
      {state && <div className="mt-3 rounded-xl bg-muted/40 p-3"><p className="text-xs font-bold">{he ? "הנתונים שהוועדה ראתה" : "The facts the committee saw"}</p><ul className="mt-1 list-disc space-y-0.5 ps-5 text-xs text-muted-foreground" dir="ltr">{state.facts.lines.map((l, i) => <li key={i}>{l}</li>)}</ul></div>}
    </section>
  );
}
