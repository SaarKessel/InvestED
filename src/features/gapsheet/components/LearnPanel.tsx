import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Lang } from "@/features/gapsheet/lib/i18n";
import { SKILLS } from "@/features/gapsheet/lib/learning/skills";
import { STAGES, nextSkill, stageName, type LearnableSkill } from "@/features/gapsheet/lib/learning/curriculum";
import { JOB_ROLES, readinessDetail, roleName } from "@/features/gapsheet/lib/learning/roles";
import { contextOf, newEntry, scoreForLevel, skillEvidence, verifiedLevel, type LedgerEntry } from "@/features/gapsheet/lib/learning/ledger";
import { generatePractice, type PracticeTask } from "@/features/gapsheet/lib/practice/generator";
import { validatePractice, type PracticeVerdict } from "@/features/gapsheet/lib/practice/validator";
import { Spreadsheet } from "./Spreadsheet";
import { parseInput, setCell, setCells } from "@/features/gapsheet/lib/workbook/engine";
import type { WorkbookState } from "@/features/gapsheet/types/workbook";

const LEVEL: Record<Lang, Record<string, string>> = {
  he: { NOT_STARTED: "טרם התחלתי", INTRODUCED: "נחשפתי", PRACTICING: "בתרגול", PROFICIENT: "שליטה", MASTERED: "שליטה מלאה" },
  en: { NOT_STARTED: "Not started", INTRODUCED: "Introduced", PRACTICING: "Practicing", PROFICIENT: "Proficient", MASTERED: "Mastered" },
};

/** Learn-by-doing: generated practice tasks validated in the browser. Only unaided, correct first attempts raise a level; hints and "show solution" never do. */
export function LearnPanel({ lang, ledger, onLedger }: { lang: Lang; ledger: LedgerEntry[]; onLedger: (next: LedgerEntry[]) => void }) {
  const t = (he: string, en: string) => (lang === "he" ? he : en);
  const scores = useMemo(() => Object.fromEntries(SKILLS.map(s => [s.id, scoreForLevel(verifiedLevel(ledger, s.id))])), [ledger]);
  const next = nextSkill(scores);
  const [task, setTask] = useState<PracticeTask | null>(null);
  const [pState, setPState] = useState<WorkbookState | null>(null);
  const [hints, setHints] = useState(0);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<PracticeVerdict | null>(null);
  const [dlg, setDlg] = useState({ column: "B", direction: "desc", op: ">", value: "" });
  const [roleId, setRoleId] = useState(JOB_ROLES[0].id);
  const role = JOB_ROLES.find(r => r.id === roleId)!;
  const detail = readinessDetail(role, scores);
  const name = (id: string) => SKILLS.find(s => s.id === id)?.name ?? id;

  const add = (e: Omit<LedgerEntry, "id" | "ts">) => onLedger([...ledger, newEntry(e)].slice(-5000));
  function start(skill: LearnableSkill) {
    const attempts = ledger.filter(e => e.skill === skill && e.source === "practice" && e.kind === "exposure").length;
    const tk = generatePractice(skill, attempts, lang);
    setTask(tk); setPState(tk.workbook); setHints(0); setRevealed(null); setVerdict(null);
    add({ skill, kind: "exposure", source: "practice", taskId: tk.id, contextId: contextOf(tk.id), hints: 0, revealed: false, correct: false });
  }
  function record(correct: boolean, tk: PracticeTask) {
    if (!correct) return;
    add({ skill: tk.skillId, kind: "attempt", source: "practice", taskId: tk.id, contextId: contextOf(tk.id), hints: revealed ? 2 : hints, revealed: !!revealed, correct: true });
  }
  function check(submission: Parameters<typeof validatePractice>[1]) {
    if (!task) return;
    const v = validatePractice(task, submission); setVerdict(v);
    if (v.correct) record(true, task);
  }
  const dialogAction = () => {
    if (!task) return {};
    if (task.mode === "dialog-dedupe") return { type: "REMOVE_DUPLICATES", sheetId: "p1", range: `A1:C${Math.max(...Object.keys(task.workbook.sheets[0].cells).map(a => Number(a.slice(1))))}` };
    if (task.mode === "dialog-sort") return { type: "SORT", sheetId: "p1", range: "A2:C7", keyColumn: dlg.column, direction: dlg.direction };
    return { type: "FILTER", sheetId: "p1", range: "A2:C7", column: dlg.column, op: dlg.op, value: Number(dlg.value) };
  };
  function reveal() { if (!task) return; setRevealed(task.solution); add({ skill: task.skillId, kind: "attempt", source: "practice", taskId: task.id, contextId: contextOf(task.id), hints: 3, revealed: true, correct: false }); }

  return (
    <div className="space-y-4 p-3 text-sm">
      {task && pState ? (
        <section className="space-y-2 rounded-lg border border-border p-3" aria-label={t("תרגול", "Practice")}>
          <div className="flex items-start justify-between gap-2"><h2 className="font-semibold">{t("תרגול:", "Practice:")} {task.instruction}</h2><button type="button" className="rounded border border-border px-2 py-1 text-xs" onClick={() => setTask(null)}>{t("סגירה", "Close")}</button></div>
          {task.mode === "formula" && <p className="text-xs text-muted-foreground">{t(`ערכו את תא ${task.targetCell} (לחיצה כפולה) והקלידו נוסחה.`, `Edit cell ${task.targetCell} (double-click) and type a formula.`)}</p>}
          <div dir="ltr" className="overflow-hidden rounded">
            <Spreadsheet lang={lang} state={pState} cols={4} rows={9} highlight={task.targetCell || null}
              onPaste={edits => { setPState(s => setCells(s!, s!.activeSheetId, edits)); setVerdict(null); }}
              onEdit={(addr, raw) => { setPState(s => setCell(s!, s!.activeSheetId, addr, parseInput(raw))); setVerdict(null); }} />
          </div>
          {task.mode !== "formula" && (
            <div className="flex flex-wrap items-center gap-2 rounded border border-border p-2">
              {task.mode === "dialog-dedupe" ? <span className="text-xs">{t("הטווח: כל הטבלה כולל הכותרת.", "Range: the whole table including the header.")}</span> : (
                <label className="text-xs">{t("עמודה", "Column")} <select value={dlg.column} onChange={e => setDlg({ ...dlg, column: e.target.value })} className="rounded border border-input bg-background px-1 py-0.5">{task.columns!.map(c => <option key={c.letter} value={c.letter}>{c.header}</option>)}</select></label>)}
              {task.mode === "dialog-sort" && <label className="text-xs">{t("סדר", "Order")} <select value={dlg.direction} onChange={e => setDlg({ ...dlg, direction: e.target.value })} className="rounded border border-input bg-background px-1 py-0.5"><option value="asc">{t("מהקטן לגדול", "Smallest to largest")}</option><option value="desc">{t("מהגדול לקטן", "Largest to smallest")}</option></select></label>}
              {task.mode === "dialog-filter" && <><label className="text-xs">{t("תנאי", "Condition")} <select value={dlg.op} onChange={e => setDlg({ ...dlg, op: e.target.value })} className="rounded border border-input bg-background px-1 py-0.5">{[">", ">=", "<", "<=", "="].map(o => <option key={o} value={o}>{o}</option>)}</select></label><input value={dlg.value} onChange={e => setDlg({ ...dlg, value: e.target.value })} placeholder={t("ערך", "Value")} aria-label={t("ערך", "Value")} className="w-20 rounded border border-input bg-background px-2 py-0.5 text-xs" /></>}
              <button type="button" className="terminal-primary rounded px-3 py-1 text-xs" onClick={() => check({ action: dialogAction() })}>{task.mode === "dialog-dedupe" ? t("הסרת כפילויות", "Remove duplicates") : t("החל", "Apply")}</button>
            </div>)}
          <div className="flex flex-wrap items-center gap-2">
            {task.mode === "formula" && <button type="button" className="terminal-primary rounded px-3 py-1 text-xs" onClick={() => check({ state: pState })}>{t("בדיקה", "Check")}</button>}
            <button type="button" disabled={hints >= 3} className="rounded border border-border px-3 py-1 text-xs disabled:opacity-40" onClick={() => setHints(h => h + 1)}>{t("רמז", "Hint")} ({hints}/3)</button>
            <button type="button" className="rounded border border-border px-3 py-1 text-xs" onClick={reveal}>{t("הצג פתרון", "Show solution")}</button>
          </div>
          {task.hints.slice(0, hints).map((h, i) => <p key={i} className="rounded bg-muted/50 px-2 py-1 text-xs">{h}</p>)}
          {revealed && <p className="rounded bg-muted/50 px-2 py-1 text-xs" dir="ltr">{revealed}</p>}
          {verdict && <p role="status" className={`rounded px-2 py-1 text-xs ${verdict.correct ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>{verdict.message}{verdict.correct && (revealed || hints > 0) ? ` ${t("נספר כתרגול עם עזרה, לא כשליטה עצמאית.", "Counted as assisted practice, not independent mastery.")}` : ""}</p>}
        </section>
      ) : next && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
          <span>{t("הצעד הבא:", "Next step:")} <strong>{name(next)}</strong></span>
          <button type="button" className="terminal-primary rounded px-3 py-1 text-xs" onClick={() => start(next)}>{t("תרגול", "Practice")}</button>
        </div>)}

      {STAGES.map(st => (
        <section key={st.id} aria-label={stageName(st, lang)} className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stageName(st, lang)}</h3>
          <ul className="space-y-1">{st.skills.map(sk => { const lvl = verifiedLevel(ledger, sk); const ev = skillEvidence(ledger, sk); return (
            <li key={sk} className="flex items-center justify-between gap-2 rounded border border-border px-2 py-1">
              <span><strong>{name(sk)}</strong> <span className="text-xs text-muted-foreground">{LEVEL[lang][lvl]}{ev.independentTasks.length ? ` · ${ev.independentTasks.length}/3 ${t("משימות עצמאיות", "independent tasks")}` : ""}</span></span>
              <button type="button" className="rounded border border-border px-2 py-0.5 text-xs" onClick={() => start(sk)}>{t("תרגל", "Practice")}</button>
            </li>); })}</ul>
        </section>))}

      <section className="space-y-2 rounded-lg border border-border p-3" aria-label={t("התאמה לתפקיד", "Role readiness")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong>{t("התאמה לתפקיד פיננסי", "Finance role readiness")}</strong>
          <select value={roleId} onChange={e => setRoleId(e.target.value)} aria-label={t("תפקיד", "Role")} className="rounded border border-input bg-background px-2 py-1 text-xs">{JOB_ROLES.map(r => <option key={r.id} value={r.id}>{roleName(r, lang)}</option>)}</select>
        </div>
        <div className="h-2 overflow-hidden rounded bg-muted" role="progressbar" aria-valuenow={detail.overall} aria-valuemin={0} aria-valuemax={100} aria-label={t("אחוז התאמה", "Readiness percent")}><div className="h-full bg-gradient-to-r from-sky-400 to-violet-500" style={{ width: `${detail.overall}%` }} /></div>
        <p className="text-xs">{detail.overall}% · {t("מבוסס רק על תרגול שהצלחתם בו לבד.", "based only on practice you completed on your own.")}</p>
        <p className="text-xs text-muted-foreground">{t("מקור: ", "Source: ")}{role.source.label} ({role.source.date}). {t("זו הערכת למידה, לא הבטחה לגבי משרה.", "A learning estimate, not a promise about any job.")}</p>
        <Link to="/career-lab" className="inline-block text-xs underline">{t("למעבדת הקריירה", "Open Career Lab")}</Link>
      </section>
    </div>
  );
}
