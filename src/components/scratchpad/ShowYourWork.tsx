import { useRef, useState } from "react";
import { PenLine } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { checkFile, giveConsent, hasConsent } from "@/lib/copilot/fileAnalysis";
import { askAboutFile, prepareFile } from "@/lib/copilot/fileClient";
import { bi, pick, type Lang } from "@/lib/literacy/bilingual";
import { fmtNumber, LIMITS, parseTranscription, solveCashflow, solveCompound, timelineEvents, toNumber, transcriptionQuestion, validateCashflow, validateCompound, type PadKind, type PadSetup } from "@/lib/scratchpad/workPad";

const T = {
  title: bi("Show your work", "הראו את החישוב"),
  intro: bi("Set up the problem yourself. You can type it, or add a photo of your hand sketch to fill the fields. You confirm every input, and the calculator engine does all the math.", "הגדירו את התרגיל בעצמכם. אפשר להקליד, או להוסיף תמונה של השרטוט שלכם כדי למלא את השדות. אתם מאשרים כל נתון, ומנוע המחשבון עושה את כל החישוב."),
  compound: bi("Compound interest", "ריבית דריבית"),
  cashflow: bi("Cash-flow timeline", "ציר תזרים"),
  principal: bi("Starting amount", "סכום התחלתי"), monthly: bi("Added each month", "תוספת חודשית"), years: bi("Years", "שנים"), annualPct: bi("Yearly rate (%)", "ריבית שנתית (%)"),
  rate: bi("Yearly rate (%)", "ריבית שנתית (%)"), time: bi("Year", "שנה"), amount: bi("Amount (in +, out -)", "סכום (נכנס +, יוצא -)"),
  addFlow: bi("Add a flow", "הוסיפו תזרים"), remove: bi("Remove", "הסירו"),
  photo: bi("Fill from a photo (optional)", "מילוי מתמונה (אופציונלי)"),
  photoFail: bi("Could not read the picture right now (the free quota may be used up, or the writing was unclear). Type the numbers instead.", "לא הצלחנו לקרוא את התמונה כרגע (ייתכן שמכסת החינם נגמרה, או שהכתב לא ברור). הקלידו את המספרים."),
  photoOk: bi("Filled from your picture. The reading can be wrong: check every field against your sketch before you confirm.", "מולא מהתמונה שלכם. הקריאה יכולה להיות שגויה: בדקו כל שדה מול השרטוט לפני האישור."),
  confirm: bi("I checked the inputs. Calculate.", "בדקתי את הנתונים. חשבו."),
  invalid: bi("Some fields are empty or outside the allowed range.", "יש שדות ריקים או מחוץ לטווח המותר."),
  inputs: bi("Your confirmed inputs", "הנתונים שאישרתם"),
  engine: bi("Calculator engine result", "תוצאת מנוע המחשבון"),
  steps: bi("How it was computed", "איך חושב"),
  months: bi("Months", "חודשים"), monthlyRate: bi("Monthly rate (%)", "ריבית חודשית (%)"), contributed: bi("Total you put in", "סך מה שהכנסתם"), finalBalance: bi("Balance at the end", "היתרה בסוף"), growth: bi("Growth", "רווח"),
  pv: bi("Present value (year 0)", "ערך נוכחי (שנה 0)"), fv: bi("Future value (last year)", "ערך עתידי (שנה אחרונה)"), df: bi("Discount factor", "גורם היוון"),
  note: bi("Educational only. Not a forecast or advice. The model, if used, only reads your sketch; it never calculates.", "חינוכי בלבד. לא תחזית ולא ייעוץ. המודל, אם נעשה בו שימוש, רק קורא את השרטוט; הוא אף פעם לא מחשב."),
  units: bi("Amounts use whatever currency you had in mind.", "הסכומים הם בכל מטבע שחשבתם עליו."),
  timeline: bi("Timeline", "ציר זמן"),
};
type Fields = { principal: string; monthly: string; years: string; annualPct: string };
const EMPTY: Fields = { principal: "", monthly: "", years: "", annualPct: "" };
interface FlowField { t: string; amount: string }

export function TimelineSvg({ setup, finalBalance, lang }: { setup: PadSetup; finalBalance?: number; lang: Lang }) {
  const ev = timelineEvents(setup, finalBalance);
  const maxT = Math.max(1, ...ev.map((e) => e.t));
  const maxA = Math.max(1, ...ev.map((e) => Math.abs(e.amount)));
  const x = (t: number) => 20 + (t / maxT) * 560;
  return (
    <svg viewBox="0 0 600 140" role="img" aria-label={pick(T.timeline, lang)} className="mt-2 w-full" data-testid="timeline">
      <line x1="20" y1="70" x2="580" y2="70" stroke="currentColor" strokeOpacity="0.4" />
      {ev.map((e, i) => {
        const h = (Math.abs(e.amount) / maxA) * 50;
        const up = e.amount >= 0;
        return (
          <g key={i}>
            <line x1={x(e.t)} y1="70" x2={x(e.t)} y2={up ? 70 - h : 70 + h} stroke={up ? "#16a34a" : "#dc2626"} strokeWidth="3" />
            <text x={x(e.t)} y={up ? 66 - h : 82 + h} fontSize="10" textAnchor="middle" fill="currentColor">{fmtNumber(e.amount, lang)}</text>
            <text x={x(e.t)} y="132" fontSize="10" textAnchor="middle" fill="currentColor" fillOpacity="0.7">{e.t}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function ShowYourWork() {
  const { t, language } = useLanguage();
  const lang: Lang = language === "he" ? "he" : "en";
  const [kind, setKind] = useState<PadKind>("compound");
  const [f, setF] = useState<Fields>(EMPTY);
  const [rate, setRate] = useState("");
  const [flows, setFlows] = useState<FlowField[]>([{ t: "0", amount: "" }, { t: "1", amount: "" }]);
  const [confirmed, setConfirmed] = useState<PadSetup | null>(null);
  const [showInvalid, setShowInvalid] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<"ok" | "fail" | null>(null);
  const [busy, setBusy] = useState(false);
  const [consentAsk, setConsentAsk] = useState(false);
  const [consented, setConsented] = useState(() => hasConsent());
  const fileInput = useRef<HTMLInputElement>(null);

  const edit = () => { setConfirmed(null); setShowInvalid(false); };
  const setField = (k: keyof Fields, v: string) => { setF((p) => ({ ...p, [k]: v })); edit(); };

  async function onFile(file: File | undefined) {
    if (!file) return;
    setPhotoMsg(null);
    if (checkFile(file) !== null || !file.type.startsWith("image/")) { setPhotoMsg("fail"); return; }
    setBusy(true);
    try {
      const prepared = await prepareFile(file);
      const text = prepared ? await askAboutFile(prepared, transcriptionQuestion(kind, lang), lang) : null;
      const parsed = parseTranscription(kind, text);
      if (!parsed) { setPhotoMsg("fail"); return; }
      if (parsed.compound) setF({ principal: parsed.compound.principal?.toString() ?? "", monthly: parsed.compound.monthly?.toString() ?? "", years: parsed.compound.years?.toString() ?? "", annualPct: parsed.compound.annualPct?.toString() ?? "" });
      if (parsed.cashflow) { setRate(parsed.cashflow.ratePct?.toString() ?? ""); setFlows(parsed.cashflow.flows.length ? parsed.cashflow.flows.map((x) => ({ t: String(x.t), amount: String(x.amount) })) : [{ t: "0", amount: "" }]); }
      edit(); setPhotoMsg("ok");
    } catch { setPhotoMsg("fail"); } finally { setBusy(false); if (fileInput.current) fileInput.current.value = ""; }
  }
  function openPicker() { if (!consented) { setConsentAsk(true); return; } fileInput.current?.click(); }

  function confirm() {
    const setup: PadSetup | null = kind === "compound"
      ? validateCompound({ principal: toNumber(f.principal), monthly: f.monthly.trim() === "" ? 0 : toNumber(f.monthly), years: toNumber(f.years), annualPct: toNumber(f.annualPct) })
      : validateCashflow(toNumber(rate), flows.map((x) => ({ t: toNumber(x.t), amount: toNumber(x.amount) })));
    if (!setup) { setShowInvalid(true); setConfirmed(null); return; }
    setShowInvalid(false); setConfirmed(setup);
  }

  const input = "w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm";
  const lbl = "block text-xs font-semibold text-foreground";
  const compound = confirmed?.kind === "compound" ? solveCompound(confirmed) : null;
  const cash = confirmed?.kind === "cashflow" ? solveCashflow(confirmed) : null;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 md:p-6" aria-label={pick(T.title, lang)} data-testid="show-your-work" dir={lang === "he" ? "rtl" : "ltr"}>
      <h2 className="flex items-center gap-2 text-xl font-bold"><PenLine className="h-5 w-5 text-primary" />{pick(T.title, lang)}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{pick(T.intro, lang)}</p>
      <div className="mt-3 flex gap-2" role="group" aria-label={pick(T.title, lang)}>
        {(["compound", "cashflow"] as PadKind[]).map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); edit(); setPhotoMsg(null); }}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${kind === k ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>{pick(T[k], lang)}</button>
        ))}
      </div>

      {kind === "compound" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {(["principal", "monthly", "years", "annualPct"] as const).map((k) => (
            <label key={k} className={lbl}>{pick(T[k], lang)}<input inputMode="decimal" dir="ltr" className={input} value={f[k]} onChange={(e) => setField(k, e.target.value)} /></label>
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <label className={`${lbl} max-w-[12rem]`}>{pick(T.rate, lang)}<input inputMode="decimal" dir="ltr" className={input} value={rate} onChange={(e) => { setRate(e.target.value); edit(); }} /></label>
          {flows.map((x, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2" data-testid="flow-row">
              <label className={`${lbl} w-24`}>{pick(T.time, lang)}<input inputMode="decimal" dir="ltr" className={input} value={x.t} onChange={(e) => { setFlows((p) => p.map((q, j) => (j === i ? { ...q, t: e.target.value } : q))); edit(); }} /></label>
              <label className={`${lbl} w-40`}>{pick(T.amount, lang)}<input inputMode="decimal" dir="ltr" className={input} value={x.amount} onChange={(e) => { setFlows((p) => p.map((q, j) => (j === i ? { ...q, amount: e.target.value } : q))); edit(); }} /></label>
              {flows.length > 1 && <button type="button" onClick={() => { setFlows((p) => p.filter((_, j) => j !== i)); edit(); }} className="text-xs text-muted-foreground underline">{pick(T.remove, lang)}</button>}
            </div>
          ))}
          {flows.length < LIMITS.maxFlows && <button type="button" onClick={() => { setFlows((p) => [...p, { t: "", amount: "" }]); edit(); }} className="text-xs font-semibold text-primary">{pick(T.addFlow, lang)}</button>}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={openPicker} disabled={busy} className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50">{pick(T.photo, lang)}</button>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={pick(T.photo, lang)} onChange={(e) => void onFile(e.target.files?.[0])} />
        <button type="button" onClick={confirm} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{pick(T.confirm, lang)}</button>
      </div>
      {consentAsk && !consented && (
        <div role="alertdialog" aria-label={t("file_consent_title")} className="mt-3 rounded-2xl border border-border bg-muted/50 p-3 text-xs leading-5" data-testid="pad-consent">
          <p className="font-semibold">{t("file_consent_title")}</p>
          <p className="mt-1 text-muted-foreground">{t("file_consent_body")}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => { giveConsent(); setConsented(true); setConsentAsk(false); window.setTimeout(() => fileInput.current?.click(), 0); }} className="rounded-full bg-primary px-3 py-1.5 font-medium text-primary-foreground">{t("file_consent_yes")}</button>
            <button type="button" onClick={() => setConsentAsk(false)} className="rounded-full border border-border px-3 py-1.5 text-muted-foreground">{t("file_consent_no")}</button>
          </div>
        </div>
      )}
      {busy && <p className="mt-2 text-xs text-muted-foreground" role="status">…</p>}
      {photoMsg && <p className="mt-2 text-xs text-muted-foreground" role="status" data-testid="photo-msg">{pick(photoMsg === "ok" ? T.photoOk : T.photoFail, lang)}</p>}
      {showInvalid && <p className="mt-2 text-xs font-semibold text-destructive" role="alert">{pick(T.invalid, lang)}</p>}

      {confirmed && (compound || cash) && (
        <div className="mt-5 space-y-3 rounded-2xl border border-border bg-background p-4 text-sm" data-testid="pad-result">
          <p className="font-bold">{pick(T.inputs, lang)}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {confirmed.kind === "compound"
              ? `${fmtNumber(confirmed.principal, lang)} + ${fmtNumber(confirmed.monthly, lang)}/mo, ${confirmed.years}y, ${confirmed.annualPct}%`
              : `${confirmed.ratePct}%: ${confirmed.flows.map((x) => `${x.t}y ${fmtNumber(x.amount, lang)}`).join(" | ")}`}
          </p>
          <div dir="ltr"><TimelineSvg setup={confirmed} finalBalance={compound?.finalBalance} lang={lang} /></div>
          <p className="font-bold">{pick(T.engine, lang)}</p>
          {compound && confirmed.kind === "compound" && (
            <ul className="space-y-1 text-xs" dir="ltr">
              <li>{pick(T.steps, lang)}: {pick(T.months, lang)} = {compound.months}; {pick(T.monthlyRate, lang)} = {fmtNumber(compound.monthlyRatePct, lang)}</li>
              <li>{pick(T.contributed, lang)}: <strong>{fmtNumber(compound.totalContributed, lang)}</strong></li>
              <li>{pick(T.finalBalance, lang)}: <strong>{fmtNumber(compound.finalBalance, lang)}</strong></li>
              <li>{pick(T.growth, lang)}: <strong>{fmtNumber(compound.growth, lang)}</strong></li>
            </ul>
          )}
          {cash && (
            <div dir="ltr">
              <table className="w-full text-xs"><thead><tr className="text-start"><th>{pick(T.time, lang)}</th><th>{pick(T.amount, lang)}</th><th>{pick(T.df, lang)}</th><th>PV</th></tr></thead>
                <tbody>{cash.rows.map((r, i) => <tr key={i}><td>{r.t}</td><td>{fmtNumber(r.amount, lang)}</td><td>{r.discountFactor.toFixed(4)}</td><td>{fmtNumber(r.presentValue, lang)}</td></tr>)}</tbody></table>
              <p className="mt-2 text-xs">{pick(T.pv, lang)}: <strong>{fmtNumber(cash.presentValue, lang)}</strong></p>
              <p className="text-xs">{pick(T.fv, lang)} ({cash.horizon}): <strong>{fmtNumber(cash.futureValue, lang)}</strong></p>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">{pick(T.units, lang)}</p>
        </div>
      )}
      <p className="mt-4 text-[11px] leading-4 text-muted-foreground">{pick(T.note, lang)}</p>
    </section>
  );
}
