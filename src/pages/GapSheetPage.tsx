import { useMemo, useRef, useState } from "react";
import { useLanguage } from "@/context/languageContext";
import { Spreadsheet } from "@/features/gapsheet/components/Spreadsheet";
import type { WorkbookState } from "@/features/gapsheet/types/workbook";
import type { Action } from "@/features/gapsheet/types/actions";
import type { Explanation } from "@/features/gapsheet/types/ai";
import { newWorkbook } from "@/features/gapsheet/lib/workbook/sample";
import { parseInput, setCells } from "@/features/gapsheet/lib/workbook/engine";
import { buildContext } from "@/features/gapsheet/lib/ai/context";
import { parseIntent } from "@/features/gapsheet/lib/ai/intent";
import { explainActions } from "@/features/gapsheet/lib/ai/explain";
import { executeActions } from "@/features/gapsheet/lib/actions/executor";
import type { Lang } from "@/features/gapsheet/lib/i18n";

type Msg =
  | { role: "user"; text: string }
  | { role: "ai"; kind: "ok"; ex: Explanation }
  | { role: "ai"; kind: "ask"; text: string; options: string[] }
  | { role: "ai"; kind: "info"; text: string }
  | { role: "ai"; kind: "confirm"; text: string; actions: Action[]; focus: string; done?: boolean };

/** GapSheet inside InvestED: natural-language spreadsheet work with the Excel formula shown. Runs fully in the browser; no sheet data leaves the device. */
export default function GapSheetPage() {
  const { language } = useLanguage();
  const lang: Lang = language === "he" ? "he" : "en";
  const t = (he: string, en: string) => (lang === "he" ? he : en);
  const [state, setState] = useState<WorkbookState>(() => newWorkbook());
  const [history, setHistory] = useState<WorkbookState[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [selection, setSelection] = useState<string | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const examples = useMemo(() => lang === "he"
    ? ["חשב סך מכירות", "חשב ממוצע מכירות", "מיין מהגבוה לנמוך", "הפוך את הכותרות למודגשות"]
    : ["Add up Sales", "Calculate the average of Sales", "Sort from high to low", "Make the headers bold"], [lang]);

  const push = (...m: Msg[]) => { setMsgs(prev => [...prev, ...m]); setTimeout(() => log.current?.scrollTo({ top: 1e6 }), 0); };
  const commit = (after: WorkbookState) => { setHistory(h => [...h, state]); setState(after); };

  function run(text: string) {
    const message = text.trim();
    if (!message) return;
    setInput("");
    push({ role: "user", text: message });
    const ctx = buildContext(state, selection);
    const r = parseIntent(message, ctx, state, lang);
    if (r.kind === "unsupported") return push({ role: "ai", kind: "info", text: r.message });
    if (r.kind === "clarification") return push({ role: "ai", kind: "ask", text: r.question, options: r.options });
    const res = executeActions(r.actions, state, { source: "ai", lang });
    if (res.status === "rejected") return push({ role: "ai", kind: "info", text: res.error });
    if (res.status === "confirmation_required") return push({ role: "ai", kind: "confirm", text: t("הפעולה משנה נתונים קיימים. לאשר?", "This changes existing data. Confirm?"), actions: r.actions, focus: r.focus });
    commit(res.after);
    push({ role: "ai", kind: "ok", ex: explainActions(r.actions, r.focus, res.after, lang) });
  }
  function confirm(i: number, yes: boolean) {
    const m = msgs[i];
    if (m.role !== "ai" || m.kind !== "confirm" || m.done !== undefined) return;
    setMsgs(prev => prev.map((x, j) => (j === i && x.role === "ai" && x.kind === "confirm" ? { ...x, done: yes } : x)));
    if (!yes) return;
    const res = executeActions(m.actions, state, { source: "ai", confirmed: true, lang });
    if (res.status === "success") { commit(res.after); push({ role: "ai", kind: "ok", ex: explainActions(m.actions, m.focus, res.after, lang) }); }
    else if (res.status === "rejected") push({ role: "ai", kind: "info", text: res.error });
  }
  const undo = () => { const prev = history[history.length - 1]; if (!prev) return; setState(prev); setHistory(h => h.slice(0, -1)); };
  const edit = (address: string, raw: string) => { const p = parseInput(raw); void p; commit(setCells(state, state.activeSheetId, [{ address, raw }])); };
  const paste = (edits: { address: string; raw: string }[]) => commit(setCells(state, state.activeSheetId, edits));

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4" dir={lang === "he" ? "rtl" : "ltr"} data-testid="gapsheet-page">
      <header className="space-y-1">
        <span className="terminal-eyebrow">GAPSHEET / SPREADSHEET LAB</span>
        <h1 className="text-2xl font-bold">{t("GapSheet: אקסל בשפה שלך", "GapSheet: Excel in your own words")}</h1>
        <p className="text-sm text-muted-foreground">{t("כתבו מה לעשות בטבלה, ראו את השינוי ואת נוסחת האקסל המקבילה. הכול רץ בדפדפן, הנתונים לא יוצאים מהמכשיר.", "Say what to do with the table, see the change and the equivalent Excel formula. Everything runs in your browser; your data stays on your device.")}</p>
      </header>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-label={t("גיליון", "Sheet")} className="terminal-panel overflow-hidden" dir="ltr">
          <Spreadsheet state={state} onEdit={edit} onPaste={paste} onSelect={setSelection} cols={6} rows={14} lang={lang} />
        </section>
        <section aria-label={t("בקשות", "Requests")} className="terminal-panel flex min-h-[360px] flex-col">
          <div className="flex items-center justify-between border-b border-border p-2">
            <strong className="text-sm">{t("מה לעשות בטבלה?", "What should I do with the table?")}</strong>
            <button type="button" onClick={undo} disabled={!history.length} className="rounded border border-border px-2 py-1 text-xs disabled:opacity-40">{t("בטל", "Undo")}</button>
          </div>
          <div ref={log} className="flex-1 space-y-2 overflow-auto p-3 text-sm" aria-live="polite">
            {!msgs.length && <div className="flex flex-wrap gap-2">{examples.map(e => <button key={e} type="button" className="welcome-chip rounded-full border border-border px-3 py-1 text-xs" onClick={() => run(e)}>{e}</button>)}</div>}
            {msgs.map((m, i) => m.role === "user"
              ? <p key={i} className="ms-auto w-fit max-w-[85%] rounded-lg bg-primary/20 px-3 py-1.5">{m.text}</p>
              : m.kind === "ok"
                ? <div key={i} className="space-y-1 rounded-lg border border-border bg-muted/40 p-3"><p className="font-semibold">{m.ex.summary}</p>{m.ex.whatChanged.map((w, j) => <p key={j} className="text-xs text-muted-foreground">{w}</p>)}{m.ex.excelEquivalent && <p className="text-xs" dir="ltr">Excel: <code className="rounded bg-background px-1 py-0.5 font-mono">{m.ex.excelEquivalent}</code></p>}{m.ex.whyItWorks && <p className="text-xs text-muted-foreground">{m.ex.whyItWorks}</p>}</div>
                : m.kind === "ask"
                  ? <div key={i} className="space-y-2 rounded-lg border border-border p-3"><p>{m.text}</p><div className="flex flex-wrap gap-2">{m.options.map(o => <button key={o} type="button" className="welcome-chip rounded-full border border-border px-3 py-1 text-xs" onClick={() => run(o)}>{o}</button>)}</div></div>
                  : m.kind === "info"
                    ? <p key={i} className="rounded-lg border border-border p-3">{m.text}</p>
                    : <div key={i} className="space-y-2 rounded-lg border border-border p-3"><p>{m.text}</p>{m.done === undefined ? <div className="flex gap-2"><button type="button" className="terminal-primary rounded px-3 py-1 text-xs" onClick={() => confirm(i, true)}>{t("אישור", "Confirm")}</button><button type="button" className="rounded border border-border px-3 py-1 text-xs" onClick={() => confirm(i, false)}>{t("ביטול", "Cancel")}</button></div> : <p className="text-xs text-muted-foreground">{m.done ? t("אושר", "Confirmed") : t("בוטל", "Cancelled")}</p>}</div>)}
          </div>
          <form className="flex gap-2 border-t border-border p-2" onSubmit={e => { e.preventDefault(); run(input); }}>
            <input value={input} onChange={e => setInput(e.target.value)} aria-label={t("בקשה לטבלה", "Request for the table")} placeholder={t("למשל: חשב סך מכירות", "e.g. Add up Sales")} className="min-w-0 flex-1 rounded border border-input bg-background px-3 py-2 text-sm" />
            <button type="submit" className="terminal-primary rounded px-4 py-2 text-sm">{t("שלח", "Send")}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
