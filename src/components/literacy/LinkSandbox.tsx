import { useState } from "react";
import { Link2 } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { CHECKLIST, CHECKLIST_QUESTION, EXERCISES, MAX_LINK_CHARS, NO_NOTICES, readLink, SANDBOX_NOTE, SYNTHETIC_NOTE, type LinkReading, type Segment } from "@/lib/literacy/linkSandbox";
import { bi, pick, type Lang } from "@/lib/literacy/bilingual";

const T = {
  title: bi("Suspicious-link sandbox", "ארגז חול לקישורים חשודים"),
  intro: bi("Practice reading a link before you trust it. Nothing here opens a link.", "תרגלו קריאה של קישור לפני שסומכים עליו. שום דבר כאן לא פותח קישור."),
  tap: bi("Tap the part of the link that decides where you land.", "לחצו על החלק בקישור שקובע לאן מגיעים."),
  right: bi("Yes. The host decides where the browser goes.", "נכון. הכתובת (host) קובעת לאן הדפדפן הולך."),
  wrong: bi("Not that part. The host decides where the browser goes.", "לא החלק הזה. הכתובת (host) קובעת לאן הדפדפן הולך."),
  realHost: bi("Real host", "הכתובת האמיתית"),
  registered: bi("Registered name (best guess)", "השם הרשום (הערכה)"),
  notice: bi("Worth noticing", "שווה לשים לב"),
  own: bi("Read a link you have", "קראו קישור שיש לכם"),
  read: bi("Read it", "קראו"),
  unreadable: bi("This does not read as a web address (http or https).", "זה לא נקרא ככתובת אינטרנט (http או https)."),
  heuristic: bi("The registered name is a simple guess, not a lookup.", "השם הרשום הוא ניחוש פשוט, לא חיפוש."),
  tick: bi("Tick what you would do:", "סמנו מה הייתם עושים:"),
  missed: bi("Not ticked yet", "עדיין לא סומן"),
  edu: bi("Educational practice only. Not a security tool and not advice.", "תרגול חינוכי בלבד. לא כלי אבטחה ולא ייעוץ."),
  kind: { scheme: bi("protocol", "פרוטוקול"), userinfo: bi("label before @", "תווית לפני @"), host: bi("host", "כתובת"), port: bi("port", "פורט"), rest: bi("path", "נתיב") },
};

/** The link is always rendered as plain text. It is never an anchor and never opened. */
function Reading({ r, lang }: { r: LinkReading; lang: Lang }) {
  if (!r.readable) return <p className="text-xs text-muted-foreground">{pick(T.unreadable, lang)}</p>;
  return (
    <div className="space-y-2 text-xs leading-5" data-testid="link-reading">
      <p><span className="font-semibold">{pick(T.realHost, lang)}: </span><code dir="ltr" className="rounded bg-muted px-1.5 py-0.5">{r.host}</code></p>
      {r.hostKind === "name" && <p><span className="font-semibold">{pick(T.registered, lang)}: </span><code dir="ltr" className="rounded bg-muted px-1.5 py-0.5">{r.registrable}</code> <span className="text-muted-foreground">{pick(T.heuristic, lang)}</span></p>}
      {r.notices.length === 0 ? <p>{pick(NO_NOTICES, lang)}</p> : (
        <div><p className="font-semibold">{pick(T.notice, lang)}:</p><ul className="ms-4 list-disc space-y-1">{r.notices.map((n) => <li key={n.id} data-notice={n.id}>{pick(n.text, lang)}</li>)}</ul></div>
      )}
    </div>
  );
}

function Exercise({ link, hint, lang }: { link: string; hint: typeof EXERCISES[number]["hint"]; lang: Lang }) {
  const r = readLink(link);
  const [picked, setPicked] = useState<Segment["kind"] | null>(null);
  return (
    <div className="rounded-xl border border-border bg-background p-3" data-testid="link-exercise">
      <p className="text-xs text-muted-foreground">{pick(T.tap, lang)} {pick(hint, lang)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1" dir="ltr" role="group" aria-label={pick(T.tap, lang)}>
        {r.segments.map((s, i) => (
          <button key={i} type="button" onClick={() => setPicked(s.kind)} aria-label={`${pick(T.kind[s.kind], lang)}: ${s.text}`}
            className={`rounded border px-1.5 py-1 font-mono text-xs ${picked === s.kind ? (s.kind === "host" ? "border-emerald-500 bg-emerald-500/10" : "border-amber-500 bg-amber-500/10") : "border-border hover:bg-muted"}`}>{s.text}</button>
        ))}
      </div>
      {picked && (
        <div className="mt-2 space-y-2">
          <p className="text-xs font-semibold" data-testid="exercise-verdict">{pick(picked === "host" ? T.right : T.wrong, lang)}</p>
          <Reading r={r} lang={lang} />
        </div>
      )}
    </div>
  );
}

export function LinkSandbox() {
  const { language } = useLanguage();
  const lang: Lang = language === "he" ? "he" : "en";
  const [text, setText] = useState("");
  const [reading, setReading] = useState<LinkReading | null>(null);
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  return (
    <div className="space-y-6" dir={lang === "he" ? "rtl" : "ltr"} data-testid="link-sandbox">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold"><Link2 className="h-5 w-5 text-primary" />{pick(T.title, lang)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{pick(T.intro, lang)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{pick(SYNTHETIC_NOTE, lang)}</p>
      </header>
      <section className="space-y-3" aria-label={pick(T.title, lang)}>
        {EXERCISES.map((e) => <Exercise key={e.id} link={e.link} hint={e.hint} lang={lang} />)}
      </section>
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold">{pick(CHECKLIST_QUESTION, lang)}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{pick(T.tick, lang)}</p>
        <ul className="mt-2 space-y-1.5">
          {CHECKLIST.map((c) => (
            <li key={c.id}>
              <label className="flex items-start gap-2 text-xs leading-5">
                <input type="checkbox" className="mt-1" checked={ticked.has(c.id)} onChange={() => setTicked((s) => { const n = new Set(s); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })} />
                <span>{pick(c.text, lang)}{ticked.size > 0 && !ticked.has(c.id) && <em className="ms-1 text-muted-foreground">({pick(T.missed, lang)})</em>}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold">{pick(T.own, lang)}</h2>
        <form className="mt-2 flex flex-col gap-2 sm:flex-row" onSubmit={(ev) => { ev.preventDefault(); setReading(readLink(text)); }}>
          <input value={text} onChange={(ev) => setText(ev.target.value.slice(0, MAX_LINK_CHARS))} dir="ltr" autoComplete="off" spellCheck={false}
            aria-label={pick(bi("Link", "קישור"), lang)} className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm" />
          <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{pick(T.read, lang)}</button>
        </form>
        {reading && <div className="mt-3"><Reading r={reading} lang={lang} /></div>}
      </section>
      <p className="text-[11px] leading-4 text-muted-foreground">{pick(SANDBOX_NOTE, lang)} {pick(T.edu, lang)}</p>
    </div>
  );
}
