import { useState } from "react";
import { useLanguage } from "@/context/languageContext";
import type { CandleDatum } from "@/types";
import type { Metric, PerformanceReport } from "@/lib/backtest/performance";
import { walkForward } from "@/lib/algo/walkForward";
import { evaluatePaperRun, newPaperRun, PaperLimitError, readPaperRuns, removePaperRun, savePaperRun, type PaperRun } from "@/lib/algo/paper";
import type { SimOptions } from "@/lib/algo/backtest";
import type { RuleStrategy } from "@/lib/algo/rules";
import { fetchMarketAssetBySymbol } from "@/lib/marketData";

const num = (m: Metric) => (m.status === "computed" ? `${m.value}` : "-");
const sharpe = (m: Metric<PerformanceReport>) => (m.status === "computed" ? num(m.value.sharpeRatio) : "-");
const ret = (m: Metric<PerformanceReport>) => (m.status === "computed" ? `${m.value.totalReturnPct}%` : "-");

export function WalkForwardView({ history, strategy, options }: { history: CandleDatum[]; strategy: RuleStrategy; options: SimOptions }) {
  const { t, language } = useLanguage();
  const lang = language === "he" ? "he" : "en";
  const wf = walkForward(history, strategy, options);
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <p className="mb-1 text-xs font-bold">{t("wf_title", "Out-of-sample check")}</p>
      <p className="mb-2 text-[11px] text-muted-foreground">{t("wf_sub", "The history is cut by time: the first 70% to build the rules, the last 30% they have never seen.")}</p>
      {wf.status === "unavailable" ? (
        <p className="text-xs text-muted-foreground">{t("wf_unavailable", "Not enough history for this check.")}</p>
      ) : (
        <>
          <table className="w-full text-xs" dir="ltr">
            <thead><tr className="text-start text-muted-foreground"><th>{t("wf_col_part", "Part")}</th><th>{t("wf_col_return", "Return")}</th><th>Sharpe</th><th>{t("wf_col_trades", "Trades")}</th></tr></thead>
            <tbody>
              <tr><td>{t("wf_in", "In-sample")}</td><td>{ret(wf.value.inSample)}</td><td>{sharpe(wf.value.inSample)}</td><td>{wf.value.inSampleTrades}</td></tr>
              <tr><td>{t("wf_out", "Out-of-sample")} ({wf.value.splitDate}+)</td><td>{ret(wf.value.outOfSample)}</td><td>{sharpe(wf.value.outOfSample)}</td><td>{wf.value.outOfSampleTrades}</td></tr>
            </tbody>
          </table>
          {wf.value.windows.length > 0 && (
            <table className="mt-2 w-full text-xs" dir="ltr">
              <thead><tr className="text-start text-muted-foreground"><th>{t("wf_col_window", "Window")}</th><th>{t("wf_col_return", "Return")}</th><th>{t("slab_perf_mdd", "Max drawdown")}</th><th>{t("wf_col_trades", "Trades")}</th></tr></thead>
              <tbody>
                {wf.value.windows.map((w) => (
                  <tr key={w.startDate}><td>{w.startDate} to {w.endDate}</td><td>{num(w.returnPct)}%</td><td>{num(w.maxDrawdownPct)}%</td><td>{w.trades}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {wf.value.warnings.length > 0 && (
            <ul className="mt-2 list-disc ps-5 text-xs leading-6 text-warning">{wf.value.warnings.map((w, i) => <li key={i}>{w[lang]}</li>)}</ul>
          )}
        </>
      )}
    </div>
  );
}

export function PaperTrading({ symbol, history, strategy, options }: { symbol: string; history: CandleDatum[]; strategy: RuleStrategy; options: SimOptions }) {
  const { t } = useLanguage();
  const [runs, setRuns] = useState<PaperRun[]>(() => readPaperRuns());
  const [msg, setMsg] = useState<string | null>(null);
  const [live, setLive] = useState<Record<string, string>>({});
  const lastDate = history.length ? [...history].map((h) => h.date).sort().at(-1)! : null;

  function start() {
    if (!lastDate) return;
    try {
      setRuns(savePaperRun(newPaperRun(symbol, strategy, (({ tradeFromDate: _ignored, ...rest }) => rest)(options), lastDate)));
      setMsg(null);
    } catch (e) {
      setMsg(e instanceof PaperLimitError ? t("paper_limit", "You have 10 paper runs. Remove one first.") : t("paper_err", "Could not save the paper run."));
    }
  }

  async function check(run: PaperRun) {
    setLive((l) => ({ ...l, [run.id]: t("paper_checking", "Checking...") }));
    try {
      const asset = await fetchMarketAssetBySymbol(run.symbol, "5y", undefined, { allowSimulated: false });
      if (!asset || asset.isMock || asset.dataSource === "mock") throw new Error("no data");
      const s = evaluatePaperRun(run, asset.history);
      const text = s.status === "waiting"
        ? t("paper_waiting", "No new trading day since you started. Check again later.")
        : t("paper_status", "Virtual account: {value} ({ret}%) after {bars} trading days, {trades} completed trades.")
            .replace("{value}", s.currentValue.toFixed(2)).replace("{ret}", String(s.returnPct)).replace("{bars}", String(s.barsSinceStart)).replace("{trades}", String(s.sim.trades.length));
      setLive((l) => ({ ...l, [run.id]: text }));
    } catch {
      setLive((l) => ({ ...l, [run.id]: t("rule_err_data", "Real price history is unavailable right now.") }));
    }
  }

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <p className="mb-1 text-xs font-bold">{t("paper_title", "Paper trading (virtual $10,000)")}</p>
      <p className="mb-2 text-[11px] text-muted-foreground">{t("paper_sub", "Save these rules today. They only trade days that come after today, using real prices. Nothing is sent to a broker and it is stored on this device only.")}</p>
      <button type="button" onClick={start} disabled={!lastDate} className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50">
        {t("paper_start", "Start paper trading from the latest day")}
      </button>
      {msg && <p role="alert" className="mt-2 text-xs text-danger">{msg}</p>}
      {runs.length > 0 && (
        <ul className="mt-2 space-y-2 text-xs">
          {runs.map((r) => (
            <li key={r.id} className="rounded-lg border border-border p-2">
              <p dir="auto"><span className="font-semibold" dir="ltr">{r.symbol}</span> - {t("paper_since", "since")} <span dir="ltr">{r.startDate}</span></p>
              {live[r.id] && <p className="mt-1 text-muted-foreground" dir="auto">{live[r.id]}</p>}
              <div className="mt-1 flex gap-3">
                <button type="button" className="text-primary underline" onClick={() => check(r)}>{t("paper_check", "Check now")}</button>
                <button type="button" className="text-danger underline" onClick={() => setRuns(removePaperRun(r.id))}>{t("paper_remove", "Remove")}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
