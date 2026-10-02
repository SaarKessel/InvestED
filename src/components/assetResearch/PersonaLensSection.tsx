import { useState } from "react";
import { Check, Minus, X } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import type { AssetResearch } from "@/lib/research/assetResearchEngine";
import { buildLenses, type Lens, type LensDerived, type PersonaFacts, type Status } from "@/lib/research/personaLens";
import { personaValueLabel } from "./personaLabels";

type State = { status: "idle" | "loading" | "unavailable" } | { status: "ready"; facts: PersonaFacts; lenses: Lens[]; derived: LensDerived };

const NAMES = { buffett: { en: "Buffett-style", he: "בסגנון באפט" }, graham: { en: "Graham-style", he: "בסגנון גרהם" }, lynch: { en: "Lynch-style", he: "בסגנון לינץ'" } } as const;
const MARK: Record<Status, { icon: typeof Check; en: string; he: string }> = { pass: { icon: Check, en: "pass", he: "עובר" }, fail: { icon: X, en: "fail", he: "נכשל" }, unavailable: { icon: Minus, en: "unavailable", he: "לא זמין" }, judgment: { icon: Minus, en: "your judgment", he: "שיקול דעת שלכם" } };


/** Three textbook checklists on SEC annual filings. Missing data shows "unavailable", never a made-up number. Educational checklist, not advice. */
export function PersonaLensSection({ research }: { research: AssetResearch }) {
  const { language } = useLanguage();
  const he = language === "he"; const l = he ? "he" : "en";
  const [state, setState] = useState<State>({ status: "idle" });
  async function run() {
    setState({ status: "loading" });
    try {
      const r = await fetch(`/api/persona-facts?symbol=${encodeURIComponent(research.symbol)}`);
      if (!r.ok) return setState({ status: "unavailable" });
      const j = (await r.json()) as { facts?: PersonaFacts };
      if (!j.facts) return setState({ status: "unavailable" });
      const price = research.provenance.isMock ? null : research.quote.price;
      setState({ status: "ready", facts: j.facts, ...buildLenses(j.facts, price) });
    } catch { setState({ status: "unavailable" }); }
  }
  return (
    <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="lens-title" data-testid="persona-lens">
      <h3 id="lens-title" className="font-bold">{he ? "מבט של משקיעים מפורסמים" : "Famous-investor lens"}</h3>
      <p className="mt-1 text-xs font-bold text-amber-700 dark:text-amber-300">{he ? "רשימת בדיקה לימודית, לא ייעוץ השקעות" : "Educational checklist, not investment advice"}</p>
      <p className="mt-2 text-sm text-muted-foreground">{he ? "קריטריונים פומביים מספרי לימוד, מחושבים מדוחות שנתיים של SEC (10-K) ומהמחיר המצוטט. נתון חסר מוצג כלא זמין ולא מושלם." : "Public textbook criteria computed from SEC annual filings (10-K) and the quoted price. A missing input shows as unavailable and is never filled in."}</p>
      <button type="button" onClick={run} disabled={state.status === "loading"} className="mt-4 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{state.status === "loading" ? (he ? "טוען..." : "Loading...") : (he ? "הצג את הרשימות" : "Run the checklists")}</button>
      {state.status === "unavailable" && <p className="mt-3 text-sm text-muted-foreground" role="status">{he ? "אין לי דוחות SEC עבור הסימול הזה (רק חברות אמריקאיות מדווחות שם), ולכן אין מה להציג." : "I have no SEC filings for this symbol (only US filers report there), so there is nothing to show."}</p>}
      {state.status === "ready" && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground" dir="ltr">{state.facts.name} · {he ? "דוח שנתי אחרון" : "latest annual report"} {state.derived.asOf ?? "-"}</p>
          {state.lenses.map((lens) => (
            <div key={lens.persona} data-testid={`lens-${lens.persona}`}>
              <p className="text-sm font-bold">{NAMES[lens.persona][l]} <span className="font-normal text-muted-foreground" dir="ltr">({lens.passed}/{lens.checked})</span></p>
              <ul className="mt-1 space-y-1 text-xs">
                {lens.criteria.map((c) => { const M = MARK[c.status]; return (
                  <li key={c.id} className="flex items-start gap-2"><M.icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /><span><b>{c.label[l]}</b> ({c.rule[l]}): <span dir="ltr">{personaValueLabel(c.value, l)}</span> <span className="text-muted-foreground">{M[l]}</span></span></li>
                ); })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
