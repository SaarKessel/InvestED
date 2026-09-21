import { useEffect, useMemo, useState } from "react";
import {
  FlaskConical,
  Trophy,
  RefreshCw,
  Plus,
  X,
  AlertTriangle,
  Lock,
  GraduationCap,
} from "lucide-react";

import { Layout, DisclaimerBanner } from "@/components/layout/Layout";
import { Button, Card, CardContent } from "@/components/ui/primitives";
import { useLanguage } from "@/context/languageContext";
import { listKnownAssets } from "@/lib/market/knownAssets";
import {
  createSimulation,
  valueSimulation,
  completeSimulation,
  abandonSimulation,
  sortLeaderboard,
  SIMULATION_BUDGET,
  SIMULATION_WINDOWS_DAYS,
  MAX_POSITIONS,
  type PortfolioSimulation,
  type SimulationValuation,
  type SimulationValidationError,
  type SimulationWindowDays,
} from "@/lib/simulation/simulationEngine";
import { fetchSimulationQuotes } from "@/lib/simulation/simulationClient";
import {
  getCurrentSimulation,
  saveCurrentSimulation,
  clearCurrentSimulation,
  getLeaderboard,
  addLeaderboardEntry,
} from "@/lib/simulation/simulationStorage";
import type { LeaderboardEntry } from "@/lib/simulation/simulationEngine";
import { cn } from "@/lib/utils";

const KNOWN_ASSETS = listKnownAssets();

function money(value: number, currency: string, language: string): string {
  return `${value.toLocaleString(language === "he" ? "he-IL" : "en-US", { maximumFractionDigits: 0 })} ${currency}`;
}

function pct(value: number | null): string {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export default function SimulationPage() {
  const { t, language } = useLanguage();
  const [simulation, setSimulation] = useState<PortfolioSimulation | null>(() => getCurrentSimulation());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => getLeaderboard());

  // Builder state
  const [nickname, setNickname] = useState("");
  const [windowDays, setWindowDays] = useState<SimulationWindowDays>(7);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [error, setError] = useState<SimulationValidationError | null>(null);
  const [busy, setBusy] = useState(false);

  // Active-run state
  const [valuation, setValuation] = useState<SimulationValuation | null>(null);
  const [valuing, setValuing] = useState(false);
  const [abandoning, setAbandoning] = useState(false);

  const totalWeight = useMemo(
    () => Object.values(selected).reduce((sum, weight) => sum + (Number.isFinite(weight) ? weight : 0), 0),
    [selected]
  );

  async function startSimulation() {
    setError(null);
    setBusy(true);
    try {
      const allocations = Object.entries(selected)
        .filter(([, weight]) => weight > 0)
        .map(([symbol, weightPct]) => ({
          symbol,
          name: KNOWN_ASSETS.find((asset) => asset.symbol === symbol)?.name ?? symbol,
          weightPct,
        }));
      // Pre-validate structure before paying for quotes.
      const structural = createSimulation({ nickname, windowDays, allocations, quotes: {}, now: Date.now() });
      if ("error" in structural && structural.error !== "quote_unavailable" && structural.error !== "quote_simulated") {
        setError(structural.error);
        return;
      }
      const quotes = await fetchSimulationQuotes(allocations.map((a) => a.symbol));
      const result = createSimulation({ nickname, windowDays, allocations, quotes, now: Date.now() });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      saveCurrentSimulation(result.simulation);
      setSimulation(result.simulation);
      setValuation(null);
    } catch {
      setError("quote_unavailable");
    } finally {
      setBusy(false);
    }
  }

  async function refreshValuation(sim: PortfolioSimulation) {
    setValuing(true);
    try {
      const quotes = await fetchSimulationQuotes(sim.positions.map((position) => position.symbol));
      setValuation(valueSimulation(sim, quotes, Date.now()));
      return quotes;
    } catch {
      setValuation(valueSimulation(sim, {}, Date.now()));
      return null;
    } finally {
      setValuing(false);
    }
  }

  useEffect(() => {
    if (simulation && simulation.status === "active") {
      void refreshValuation(simulation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulation?.id]);

  async function finalizeSimulation() {
    if (!simulation) return;
    setBusy(true);
    try {
      const quotes = await fetchSimulationQuotes(simulation.positions.map((position) => position.symbol));
      const result = completeSimulation(simulation, quotes, Date.now());
      if ("error" in result) {
        setError(result.error === "quote_unavailable" ? "quote_unavailable" : null);
        return;
      }
      saveCurrentSimulation(result.simulation);
      setSimulation(result.simulation);
      setLeaderboard(addLeaderboardEntry(result.entry));
      setValuation(null);
    } finally {
      setBusy(false);
    }
  }

  function confirmAbandon() {
    if (!simulation) return;
    const abandoned = abandonSimulation(simulation);
    clearCurrentSimulation();
    setSimulation(null);
    setValuation(null);
    setAbandoning(false);
    void abandoned;
  }

  function resetBuilder() {
    clearCurrentSimulation();
    setSimulation(null);
    setValuation(null);
    setSelected({});
    setError(null);
  }

  const ranked = sortLeaderboard(leaderboard);
  const isCompleted = simulation?.status === "completed";

  return (
    <Layout>
      <section className="container max-w-4xl py-8 md:py-12">
        <div className="mb-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">
            <FlaskConical className="h-4 w-4" />
            {t("sim_page_tag")}
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{t("sim_page_title")}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{t("sim_page_subtitle")}</p>
        </div>

        <div className="mb-8 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {t("sim_simulated_banner")}
        </div>

        {/* ---------------------------------------------------------- */}
        {/* BUILDER                                                     */}
        {/* ---------------------------------------------------------- */}
        {!simulation && (
          <Card>
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-lg font-bold">{t("sim_builder_title")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("sim_builder_desc")}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">{t("sim_nickname_label")}</label>
                  <input
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    placeholder={t("sim_nickname_placeholder")}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">{t("sim_window_label")}</label>
                  <div className="mt-1.5 flex gap-2">
                    {SIMULATION_WINDOWS_DAYS.map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setWindowDays(days)}
                        className={cn(
                          "flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                          windowDays === days
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        {t("sim_window_days").replace("{n}", String(days))}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">{t("sim_budget_label")}</label>
                  <p className="mt-1.5 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm font-bold" dir="ltr">
                    {SIMULATION_BUDGET.toLocaleString("en-US")} USD
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t("sim_total_label")}:{" "}
                  <span className={cn("font-bold", Math.abs(totalWeight - 100) < 0.01 ? "text-green-500" : "text-foreground")}>
                    {totalWeight.toFixed(0)}%
                  </span>
                </p>
                <div className="mt-3 space-y-2">
                  {KNOWN_ASSETS.map((asset) => {
                    const isSelected = asset.symbol in selected;
                    return (
                      <div
                        key={asset.symbol}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                          isSelected ? "border-primary/50 bg-primary/5" : "border-border"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-bold" dir="ltr">{asset.symbol}</span>
                          <span className="ms-2 text-xs text-muted-foreground">{asset.name}</span>
                        </div>
                        {isSelected ? (
                          <>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={selected[asset.symbol] || ""}
                              onChange={(event) =>
                                setSelected((prev) => ({ ...prev, [asset.symbol]: Number(event.target.value) }))
                              }
                              aria-label={`${asset.symbol} ${t("sim_weight_label")}`}
                              className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
                              dir="ltr"
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelected((prev) => {
                                  const next = { ...prev };
                                  delete next[asset.symbol];
                                  return next;
                                })
                              }
                              className="rounded-lg p-1.5 text-muted-foreground hover:text-red-500"
                              aria-label={`${t("sim_remove_asset")} ${asset.symbol}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            disabled={Object.keys(selected).length >= MAX_POSITIONS}
                            onClick={() => setSelected((prev) => ({ ...prev, [asset.symbol]: 0 }))}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            {t("sim_add_asset")}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
                  {t(`sim_error_${error}`)}
                </p>
              )}

              <div className="mt-6 flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-3.5 text-xs leading-5 text-muted-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t("sim_entry_locked_note")}
              </div>

              <Button
                size="lg"
                className="mt-6 gap-2 rounded-xl"
                disabled={busy || Object.keys(selected).length === 0}
                onClick={startSimulation}
              >
                <FlaskConical className="h-4 w-4" />
                {busy ? t("sim_starting") : t("sim_start_button")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ---------------------------------------------------------- */}
        {/* ACTIVE RUN                                                  */}
        {/* ---------------------------------------------------------- */}
        {simulation && simulation.status === "active" && (
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">
                    {t("sim_active_title")} — {simulation.nickname}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("sim_ends_at")}:{" "}
                    {new Date(simulation.endsAt).toLocaleString(language === "he" ? "he-IL" : "en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl" disabled={valuing} onClick={() => refreshValuation(simulation)}>
                  <RefreshCw className={cn("h-4 w-4", valuing && "animate-spin")} />
                  {valuing ? t("sim_refreshing") : t("sim_refresh")}
                </Button>
              </div>

              {valuation && (
                <>
                  <div className="mt-5">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                      <span>{t("sim_window_progress")}</span>
                      <span>{valuation.elapsedPct.toFixed(0)}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${valuation.elapsedPct}%` }} />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">{t("sim_total_value")}</p>
                      <p className="mt-1 text-xl font-extrabold" dir="ltr">
                        {valuation.totalCurrentValue !== null ? money(valuation.totalCurrentValue, simulation.currency, language) : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">{t("sim_total_return")}</p>
                      <p
                        className={cn(
                          "mt-1 text-xl font-extrabold",
                          valuation.totalReturnPct !== null && valuation.totalReturnPct >= 0 ? "text-green-500" : "text-red-500"
                        )}
                        dir="ltr"
                      >
                        {pct(valuation.totalReturnPct)}
                      </p>
                    </div>
                  </div>

                  {!valuation.allPricesAvailable && (
                    <p className="mt-4 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs font-semibold text-muted-foreground">
                      {t("sim_prices_unavailable")}
                    </p>
                  )}

                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-start text-xs text-muted-foreground">
                          <th className="py-2 text-start font-semibold">{t("sim_col_asset")}</th>
                          <th className="py-2 text-end font-semibold">{t("sim_col_weight")}</th>
                          <th className="py-2 text-end font-semibold">{t("sim_col_entry")}</th>
                          <th className="py-2 text-end font-semibold">{t("sim_col_current")}</th>
                          <th className="py-2 text-end font-semibold">{t("sim_col_value")}</th>
                          <th className="py-2 text-end font-semibold">{t("sim_col_return")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {valuation.positions.map((position) => (
                          <tr key={position.symbol} className="border-b border-border/50">
                            <td className="py-2.5 font-bold" dir="ltr">{position.symbol}</td>
                            <td className="py-2.5 text-end" dir="ltr">{position.weightPct}%</td>
                            <td className="py-2.5 text-end" dir="ltr">{position.entryPrice.toFixed(2)}</td>
                            <td className="py-2.5 text-end" dir="ltr">{position.currentPrice !== null ? position.currentPrice.toFixed(2) : "—"}</td>
                            <td className="py-2.5 text-end" dir="ltr">
                              {position.currentValue !== null ? money(position.currentValue, simulation.currency, language) : "—"}
                            </td>
                            <td
                              className={cn(
                                "py-2.5 text-end font-bold",
                                position.returnPct !== null && position.returnPct >= 0 ? "text-green-500" : "text-red-500"
                              )}
                              dir="ltr"
                            >
                              {pct(position.returnPct)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {valuation.windowEnded ? (
                    <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
                      <p className="text-sm font-semibold">{t("sim_complete_ready")}</p>
                      <Button className="mt-3 gap-2 rounded-xl" disabled={busy} onClick={finalizeSimulation}>
                        <Trophy className="h-4 w-4" />
                        {busy ? t("sim_completing") : t("sim_complete_button")}
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-6">
                      {abandoning ? (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
                          <p className="text-sm font-semibold text-red-500">{t("sim_abandon_confirm")}</p>
                          <div className="mt-3 flex gap-2">
                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setAbandoning(false)}>
                              ✕
                            </Button>
                            <Button size="sm" className="rounded-xl bg-red-500 text-white hover:bg-red-600" onClick={confirmAbandon}>
                              {t("sim_abandon_button")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAbandoning(true)}
                          className="text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-red-500 hover:underline"
                        >
                          {t("sim_abandon_button")}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {!valuation && (
                <p className="mt-6 text-sm text-muted-foreground">{t("sim_refreshing")}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ---------------------------------------------------------- */}
        {/* COMPLETED                                                   */}
        {/* ---------------------------------------------------------- */}
        {isCompleted && simulation && (
          <Card>
            <CardContent className="p-6 text-center sm:p-10">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Trophy className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold">{t("sim_completed_title")}</h2>
              <p
                className={cn(
                  "mt-3 font-display text-4xl font-extrabold",
                  (simulation.finalReturnPct ?? 0) >= 0 ? "text-green-500" : "text-red-500"
                )}
                dir="ltr"
              >
                {pct(simulation.finalReturnPct ?? null)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                {simulation.finalValue !== undefined ? money(simulation.finalValue, simulation.currency, language) : ""}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{t("sim_completed_desc")}</p>
              <Button className="mt-8 gap-2 rounded-xl" onClick={resetBuilder}>
                <FlaskConical className="h-4 w-4" />
                {t("sim_new_simulation")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ---------------------------------------------------------- */}
        {/* LESSONS                                                     */}
        {/* ---------------------------------------------------------- */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="flex items-center gap-2 text-base font-bold">
              <GraduationCap className="h-4 w-4 text-primary" />
              {t("sim_lessons_title")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <li>{t("sim_lesson_allocation")}</li>
              <li>{t("sim_lesson_rebalancing")}</li>
              <li>{t("sim_lesson_risk")}</li>
            </ul>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------- */}
        {/* LEADERBOARD (local)                                         */}
        {/* ---------------------------------------------------------- */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="flex items-center gap-2 text-base font-bold">
              <Trophy className="h-4 w-4 text-primary" />
              {t("sim_leaderboard_title")}
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{t("sim_leaderboard_local_note")}</p>
            {ranked.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">{t("sim_leaderboard_empty")}</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="py-2 text-start font-semibold">#</th>
                      <th className="py-2 text-start font-semibold">{t("sim_nickname_label")}</th>
                      <th className="py-2 text-end font-semibold">{t("sim_lb_col_window")}</th>
                      <th className="py-2 text-end font-semibold">{t("sim_total_return")}</th>
                      <th className="py-2 text-end font-semibold">{t("sim_lb_col_completed")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((entry, index) => (
                      <tr key={entry.id} className="border-b border-border/50">
                        <td className="py-2.5 font-bold">{index + 1}</td>
                        <td className="py-2.5">{entry.nickname}</td>
                        <td className="py-2.5 text-end" dir="ltr">{t("sim_window_days").replace("{n}", String(entry.windowDays))}</td>
                        <td className={cn("py-2.5 text-end font-bold", entry.returnPct >= 0 ? "text-green-500" : "text-red-500")} dir="ltr">
                          {pct(entry.returnPct)}
                        </td>
                        <td className="py-2.5 text-end text-xs text-muted-foreground">
                          {new Date(entry.completedAt).toLocaleDateString(language === "he" ? "he-IL" : "en-US")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <DisclaimerBanner className="mt-8" />
      </section>
    </Layout>
  );
}
