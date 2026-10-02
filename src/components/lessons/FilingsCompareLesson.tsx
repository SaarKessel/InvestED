import { useState } from "react";
import type { Comparison } from "@/lib/sec/thirteenFCompare";
import { formatUsd } from "@/lib/copilot/filingsDesk";
import { Edu, inputCls, Section } from "./shared";

const PRESETS: [string, string, string][] = [["Berkshire Hathaway", "ברקשייר האת'אווי", "0001067983"], ["Bridgewater Associates", "ברידג'ווטר", "0001350694"], ["Pershing Square", "פרשינג סקוור", "0001336528"]];
type State = { kind: "idle" } | { kind: "loading" } | { kind: "error"; code: string } | { kind: "ok"; data: Comparison };
export function FilingsCompareLesson({ he, fetcher = fetch }: { he: boolean; fetcher?: typeof fetch }) {
  const [cik, setCik] = useState("0001067983");
  const [state, setState] = useState<State>({ kind: "idle" });
  async function run() {
    setState({ kind: "loading" });
    try {
      const r = await fetcher(`/api/sec-13f?cik=${encodeURIComponent(cik.trim())}&compare=1`);
      const j = (await r.json().catch(() => ({}))) as { comparison?: Comparison; error?: string };
      if (r.ok && j.comparison && Array.isArray(j.comparison.changes)) setState({ kind: "ok", data: j.comparison });
      else setState({ kind: "error", code: j.error ?? "unknown_error" });
    } catch { setState({ kind: "error", code: "network" }); }
  }
  const label: Record<string, [string, string]> = { new: ["New in the list", "חדש ברשימה"], absent: ["Not in the later list", "לא ברשימה המאוחרת"], increased: ["More shares", "יותר מניות"], decreased: ["Fewer shares", "פחות מניות"], unchanged: ["Same shares", "אותן מניות"] };
  return (
    <Section title={he ? "השוואת שני רבעונים בטופס 13F" : "Two-quarter 13F comparison"}>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm font-medium">{he ? "מנהל" : "Manager"}<select value={PRESETS.some((p) => p[2] === cik) ? cik : ""} onChange={(e) => e.target.value && setCik(e.target.value)} className={inputCls}><option value="">{he ? "אחר (CIK)" : "Other (CIK)"}</option>{PRESETS.map((p) => <option key={p[2]} value={p[2]}>{he ? p[1] : p[0]}</option>)}</select></label>
        <label className="text-sm font-medium">CIK<input dir="ltr" value={cik} onChange={(e) => setCik(e.target.value)} className={inputCls} /></label>
        <button type="button" onClick={() => void run()} disabled={state.kind === "loading"} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{he ? "השווה" : "Compare"}</button>
      </div>
      {state.kind === "loading" && <p role="status" className="text-sm">{he ? "טוען מ-SEC..." : "Loading from the SEC..."}</p>}
      {state.kind === "error" && <p role="alert" className="text-sm text-rose-300" data-testid="compare-error">{state.code === "no_13f_found" ? (he ? "לא נמצאו שני דוחות 13F-HR מקוריים למנהל הזה." : "Fewer than two original 13F-HR filings were found for this filer.") : (he ? "לא הצלחתי לטעון את הדוחות עכשיו, ולכן לא מוצג כלום. נסו שוב בעוד רגע." : "Could not load the filings right now, so nothing is shown. Try again in a moment.")}</p>}
      {state.kind === "ok" && (
        <div className="space-y-2 text-sm" data-testid="compare-result">
          <p dir="ltr">{state.data.previousReportDate} → {state.data.currentReportDate}</p>
          <p>{(Object.keys(label) as (keyof typeof label)[]).map((k) => `${label[k][he ? 1 : 0]}: ${state.data.counts[k as keyof Comparison["counts"]]}`).join(" · ")}</p>
          <p dir="ltr">{he ? "ריכוז" : "Concentration"} (top 1 / 5 / 10): {state.data.concentrationPrev.top1Pct}/{state.data.concentrationPrev.top5Pct}/{state.data.concentrationPrev.top10Pct}% → {state.data.concentrationCur.top1Pct}/{state.data.concentrationCur.top5Pct}/{state.data.concentrationCur.top10Pct}%</p>
          <div className="max-h-72 overflow-auto" dir="ltr"><table className="w-full text-xs"><thead><tr><th className="text-start">{he ? "חברה" : "Issuer"}</th><th className="text-start">{he ? "שינוי" : "Change"}</th><th className="text-end">{he ? "מניות לפני" : "Shares before"}</th><th className="text-end">{he ? "מניות אחרי" : "Shares after"}</th><th className="text-end">{he ? "שווי לפני" : "Value before"}</th><th className="text-end">{he ? "שווי אחרי" : "Value after"}</th></tr></thead>
            <tbody>{state.data.changes.map((c) => <tr key={`${c.cusip}-${c.titleOfClass}`} className="border-t border-border/50"><td>{c.issuer}</td><td>{label[c.change][he ? 1 : 0]}</td><td className="text-end">{c.sharesPrev.toLocaleString("en-US")}</td><td className="text-end">{c.sharesCur.toLocaleString("en-US")}</td><td className="text-end">{formatUsd(c.valuePrevUsd)}</td><td className="text-end">{formatUsd(c.valueCurUsd)}</td></tr>)}</tbody></table></div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{he ? "13F מוגש עד 45 יום אחרי סוף הרבעון, כולל רק פוזיציות לונג (שורטים לא מופיעים), ואינו תיק חי. פוזיציה שאינה ברשימה המאוחרת אינה מכירה מאושרת. השווי הוא שווי סוף הרבעון כפי שדווח, בלי מחירים מוסקים." : "A 13F is filed up to 45 days after quarter end, lists long positions only (shorts are omitted), and is not a live portfolio. A position missing from the later filing is not a confirmed sale. Values are the quarter-end values as reported; no prices are inferred."}</p>
      <Edu he={he} />
    </Section>
  );
}
