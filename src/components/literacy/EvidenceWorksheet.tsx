import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { buildWorksheet, EDU_NOTE, EXAMPLES, HEADLINE_ONLY_NOTE, KIND_LABEL, LOUD_NOTE, MAX_HEADLINE_CHARS, QUIET_NOTE, type StatementKind } from "@/lib/literacy/evidenceWorksheet";
import { bi, pick, type Lang } from "@/lib/literacy/bilingual";

const CHOICES: StatementKind[] = ["fact", "opinion", "attributed"];
const T = {
  title: bi("Evidence worksheet", "דף ראיות"),
  intro: bi("Pick a label for each statement first. Then see how the checklist reads it.", "בחרו תווית לכל משפט קודם. אחר כך תראו איך רשימת הבדיקה קוראת אותו."),
  yours: bi("Your call", "ההחלטה שלכם"),
  checklist: bi("The checklist reads it as", "רשימת הבדיקה קוראת את זה כך"),
  match: bi("Same as yours.", "זהה לשלכם."),
  differ: bi("Different from yours. Both readings can be argued; look at the wording.", "שונה משלכם. אפשר לטעון לשתי הקריאות; הסתכלו על הניסוח."),
  source: bi("A primary source that would settle it", "מקור ראשוני שיכריע"),
  unverified: bi("Still unverified", "עדיין לא מאומת"),
  loud: bi("Loud wording", "ניסוח צעקני"),
  none: bi("No headline to work on.", "אין כותרת לעבוד איתה."),
};

export function EvidenceWorksheet({ headline }: { headline: string }) {
  const { language } = useLanguage();
  const lang: Lang = language === "he" ? "he" : "en";
  const [answers, setAnswers] = useState<Record<number, StatementKind>>({});
  const sheet = buildWorksheet(headline);
  if (!sheet) return <p className="text-xs text-muted-foreground">{pick(T.none, lang)}</p>;
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-xs leading-5" data-testid="evidence-worksheet" dir={lang === "he" ? "rtl" : "ltr"}>
      <p className="font-bold text-foreground">{pick(T.title, lang)}</p>
      <p className="mt-1 text-muted-foreground">{pick(T.intro, lang)}</p>
      <ol className="mt-3 space-y-3">
        {sheet.statements.map((s, i) => {
          const mine = answers[i];
          return (
            <li key={i} className="rounded-lg border border-border/60 bg-background p-3">
              <p className="font-semibold text-foreground" dir="auto">{s.text}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label={pick(T.yours, lang)}>
                <span className="text-muted-foreground">{pick(T.yours, lang)}:</span>
                {CHOICES.map((k) => (
                  <button key={k} type="button" aria-pressed={mine === k} onClick={() => setAnswers((a) => ({ ...a, [i]: k }))}
                    className={`rounded-full border px-2.5 py-1 font-semibold ${mine === k ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    {pick(KIND_LABEL[k], lang)}
                  </button>
                ))}
              </div>
              {mine && (
                <div className="mt-2 space-y-1.5" data-testid="worksheet-reveal">
                  <p><span className="font-semibold text-foreground">{pick(T.checklist, lang)}: </span>{pick(KIND_LABEL[s.kind], lang)}. {mine === s.kind ? pick(T.match, lang) : pick(T.differ, lang)}</p>
                  <p><span className="font-semibold text-foreground">{pick(T.source, lang)}: </span>{pick(s.source.text, lang)}</p>
                  <div>
                    <span className="font-semibold text-foreground">{pick(T.unverified, lang)}:</span>
                    <ul className="ms-4 list-disc">{s.unverified.map((u, j) => <li key={j}>{pick(u, lang)}</li>)}</ul>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3" data-testid="worksheet-loud">
        <span className="font-semibold text-foreground">{pick(T.loud, lang)}: </span>
        {sheet.loudSignals.length > 0 ? <><span dir="ltr">{sheet.loudSignals.join(", ")}</span>. {pick(LOUD_NOTE, lang)}</> : pick(QUIET_NOTE, lang)}
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">{pick(HEADLINE_ONLY_NOTE, lang)} {pick(EDU_NOTE, lang)}</p>
    </div>
  );
}

/** Practice panel for the News page: curated synthetic examples or any headline the learner types. */
export function EvidenceWorksheetPanel() {
  const { language } = useLanguage();
  const lang: Lang = language === "he" ? "he" : "en";
  const [text, setText] = useState("");
  const [active, setActive] = useState("");
  return (
    <section className="mb-8 rounded-2xl border border-border bg-card p-5" aria-label={pick(T.title, lang)} data-testid="evidence-panel" dir={lang === "he" ? "rtl" : "ltr"}>
      <h2 className="flex items-center gap-2 text-base font-bold"><ClipboardCheck className="h-4 w-4 text-primary" />{pick(bi("Practise reading a headline", "תרגול קריאה של כותרת"), lang)}</h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{pick(bi("Paste a headline, or try a made-up example (company names are invented). You get a worksheet, not a verdict.", "הדביקו כותרת, או נסו דוגמה בדויה (שמות החברות מומצאים). מקבלים דף עבודה, לא פסק דין."), lang)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((e) => (
          <button key={e.id} type="button" onClick={() => { setText(pick(e.headline, lang)); setActive(pick(e.headline, lang)); }}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
            {pick(bi("Example", "דוגמה"), lang)}: {pick(e.headline, lang).slice(0, 28)}…
          </button>
        ))}
      </div>
      <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(ev) => { ev.preventDefault(); setActive(text); }}>
        <input value={text} onChange={(ev) => setText(ev.target.value.slice(0, MAX_HEADLINE_CHARS))} dir="auto"
          aria-label={pick(bi("Headline", "כותרת"), lang)} className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{pick(bi("Open worksheet", "פתחו דף"), lang)}</button>
      </form>
      {active && <div className="mt-3"><EvidenceWorksheet key={active} headline={active} /></div>}
    </section>
  );
}
