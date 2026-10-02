import type { CandleDatum } from "@/types";
import { useState } from "react";
import { Loader2, Cpu } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { fetchMarketAssetBySymbol } from "@/lib/marketData";
import { researchCodeLabel } from "@/lib/research/researchLabels";
import { explainRule } from "@/lib/algo/explain";
import { ReportCardView } from "./ReportCardView";
import { PaperTrading, WalkForwardView } from "./WalkForwardView";
import { resolveOptions, type SimOptions } from "@/lib/algo/backtest";
import { buildReportCard } from "@/lib/algo/reportCard";
import { checkStrategy, countSignals, runSignals, type RuleStrategy, type SignalRun } from "@/lib/algo/rules";

type Preset = "rsi" | "macd" | "sma";

function build(preset: Preset, a: number, b: number): RuleStrategy {
  if (preset === "rsi") return { entry: [{ kind: "rsi_below", period: 14, level: a }], exit: [{ kind: "rsi_above", period: 14, level: b }] };
  if (preset === "macd") return { entry: [{ kind: "macd_cross_up", fast: 12, slow: 26, signal: 9 }], exit: [{ kind: "macd_cross_down", fast: 12, slow: 26, signal: 9 }] };
  return { entry: [{ kind: "sma_cross_up", fast: a, slow: b }], exit: [{ kind: "sma_cross_down", fast: a, slow: b }] };
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; reason: string }
  | { status: "ready"; run: SignalRun; history: CandleDatum[]; options: SimOptions; strategy: RuleStrategy; symbol: string; source: string };

export function RuleBuilderPanel() {
  const { t, language } = useLanguage();
  const lang = language === "he" ? "he" : "en";
  const [symbol, setSymbol] = useState("SPY");
  const [preset, setPreset] = useState<Preset>("rsi");
  const [a, setA] = useState(30);
  const [b, setB] = useState(70);
  const [size, setSize] = useState(100);
  const [comm, setComm] = useState(0);
  const [slip, setSlip] = useState(0);
  const [fixed, setFixed] = useState(0);
  const [state, setState] = useState<State>({ status: "idle" });

  function choose(next: Preset) {
    setPreset(next);
    if (next === "rsi") { setA(30); setB(70); }
    if (next === "sma") { setA(20); setB(50); }
    setState({ status: "idle" });
  }

  async function run() {
    const strategy = build(preset, a, b);
    const check = checkStrategy(strategy);
    if (!check.ok) { setState({ status: "error", reason: check.reason[lang] }); return; }
    const options: SimOptions = { positionPct: size, commissionPct: comm, slippagePct: slip, commissionFixed: fixed };
    try { resolveOptions(options); } catch { setState({ status: "error", reason: t("sim_err", "Check the settings.") }); return; }
    const sym = symbol.trim().toUpperCase();
    if (!sym) { setState({ status: "error", reason: t("rule_err_symbol", "Enter a symbol") }); return; }
    setState({ status: "loading" });
    try {
      const asset = await fetchMarketAssetBySymbol(sym, "5y", undefined, { allowSimulated: false });
      if (!asset || asset.isMock || asset.dataSource === "mock" || asset.history.length < 2) {
        setState({ status: "error", reason: t("rule_err_data", "Real price history is unavailable right now.") });
        return;
      }
      setState({ status: "ready", run: runSignals(asset.history, strategy), history: asset.history, options, strategy, symbol: sym, source: asset.dataSource ?? "unknown" });
    } catch {
      setState({ status: "error", reason: t("rule_err_data", "Real price history is unavailable right now.") });
    }
  }

  const input = "w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm";
  return (
    <section className="mt-8 rounded-2xl border border-border p-4" aria-live="polite">
      <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-primary"><Cpu className="h-4 w-4" /> {t("rule_title", "Build a rule-based strategy")}</h2>
      <p className="mb-3 text-xs text-muted-foreground">{t("rule_sub", "Pick an indicator rule and see on which days of real history it would have signalled. Educational simulation, not advice.")}</p>
      <div className="mb-3 flex flex-wrap items-end gap-3 text-xs">
        <label className="flex flex-col gap-1">{t("rule_symbol", "Symbol")}
          <input className={input} dir="ltr" value={symbol} onChange={(e) => setSymbol(e.target.value)} maxLength={10} />
        </label>
        <label className="flex flex-col gap-1">{t("rule_kind", "Rule")}
          <select className="rounded-lg border border-border bg-background px-2 py-1 text-sm" value={preset} onChange={(e) => choose(e.target.value as Preset)}>
            <option value="rsi">{t("rule_kind_rsi", "RSI: buy low, sell high")}</option>
            <option value="macd">{t("rule_kind_macd", "MACD crossover")}</option>
            <option value="sma">{t("rule_kind_sma", "Moving average crossover")}</option>
          </select>
        </label>
        {preset !== "macd" && (
          <>
            <label className="flex flex-col gap-1">{preset === "rsi" ? t("rule_rsi_in", "Enter below") : t("rule_sma_fast", "Fast period")}
              <input className={input} dir="ltr" type="number" value={a} onChange={(e) => setA(Number(e.target.value))} />
            </label>
            <label className="flex flex-col gap-1">{preset === "rsi" ? t("rule_rsi_out", "Exit above") : t("rule_sma_slow", "Slow period")}
              <input className={input} dir="ltr" type="number" value={b} onChange={(e) => setB(Number(e.target.value))} />
            </label>
          </>
        )}
        <details className="basis-full text-xs">
          <summary className="cursor-pointer font-semibold">{t("sim_settings", "Realism settings")}</summary>
          <div className="mt-2 flex flex-wrap gap-3">
            <label className="flex flex-col gap-1">{t("sim_size", "Position size %")}<input className={input} dir="ltr" type="number" value={size} onChange={(e) => setSize(Number(e.target.value))} /></label>
            <label className="flex flex-col gap-1">{t("sim_comm", "Commission %")}<input className={input} dir="ltr" type="number" step="0.05" value={comm} onChange={(e) => setComm(Number(e.target.value))} /></label>
            <label className="flex flex-col gap-1">{t("sim_slip", "Slippage %")}<input className={input} dir="ltr" type="number" step="0.05" value={slip} onChange={(e) => setSlip(Number(e.target.value))} /></label>
            <label className="flex flex-col gap-1">{t("sim_fixed", "Fixed fee per trade")}<input className={input} dir="ltr" type="number" value={fixed} onChange={(e) => setFixed(Number(e.target.value))} /></label>
          </div>
        </details>
        <button type="button" onClick={run} className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10">{t("rule_run", "Show signals")}</button>
      </div>
      {state.status === "loading" && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {t("slab_perf_loading", "Loading real price history...")}</p>}
      {state.status === "error" && <p role="alert" className="text-sm text-danger">{state.reason}</p>}
      {state.status === "ready" && <Result state={state} />}
      <p className="mt-3 text-[11px] text-muted-foreground">{t("rule_disclaimer", "Educational simulation, not advice. Signals describe the past on real data and do not predict the future.")}</p>
    </section>
  );
}

function Result({ state }: { state: Extract<State, { status: "ready" }> }) {
  const { t, language } = useLanguage();
  const lang = language === "he" ? "he" : "en";
  const counts = countSignals(state.run);
  const events = state.run.bars.filter((x) => x.entry || x.exit).slice(-8);
  const rules = [
    ...state.strategy.entry.map((r) => ({ side: t("rule_entry", "Entry"), r })),
    ...state.strategy.exit.map((r) => ({ side: t("rule_exit", "Exit"), r })),
  ];
  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-muted-foreground" dir="auto">
        {t("rule_summary", "{symbol}: {entries} entry signals and {exits} exit signals over {bars} days of real history (source: {source}). The first {warm} days are warm-up.")
          .replace("{symbol}", state.symbol).replace("{entries}", String(counts.entries)).replace("{exits}", String(counts.exits))
          .replace("{bars}", String(state.run.bars.length)).replace("{source}", researchCodeLabel("source", state.source as "alpha_vantage" | "yahoo_finance" | "mock", lang)).replace("{warm}", String(state.run.warmupBars))}
      </p>
      {rules.map(({ side, r }, i) => {
        const ex = explainRule(r);
        return (
          <div key={i} className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-xs font-bold">{side}: {ex.title[lang]}</p>
            <ol className="mt-1 list-decimal ps-5 text-xs leading-6 text-muted-foreground">
              {ex.steps.map((s, j) => <li key={j}>{s[lang]}</li>)}
            </ol>
          </div>
        );
      })}
      <ReportCardView card={buildReportCard(state.history, state.strategy, state.options)} />
      <WalkForwardView history={state.history} strategy={state.strategy} options={state.options} />
      <PaperTrading symbol={state.symbol} history={state.history} strategy={state.strategy} options={state.options} />
      {events.length > 0 && (
        <table className="w-full text-xs" dir="ltr">
          <thead><tr className="text-start text-muted-foreground"><th>{t("rule_col_date", "Date")}</th><th>{t("rule_col_signal", "Signal")}</th><th>{t("rule_col_close", "Close")}</th></tr></thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.date + (e.entry ? "e" : "x")}><td>{e.date}</td><td>{e.entry ? t("rule_entry", "Entry") : t("rule_exit", "Exit")}</td><td>{e.close.toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
