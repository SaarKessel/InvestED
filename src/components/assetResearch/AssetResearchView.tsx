import { useState } from "react";
import { Search, RefreshCw, GitCompareArrows, Bot, Database } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { useLanguage } from "@/context/languageContext";
import { fetchMarketAssetBySymbol } from "@/lib/marketData";
import { researchAsset, type AssetResearch } from "@/lib/research/assetResearchEngine";
import { useAnalysis } from "@/context/useAnalysis";

const unavailable = (language: string) => language === "he" ? "הנתונים אינם זמינים" : "Data unavailable";
export function AssetResearchView() {
  const { language, t } = useLanguage(); const { askCopilot } = useAnalysis();
  const [query, setQuery] = useState("NVDA"); const [research, setResearch] = useState<AssetResearch | null>(null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [aiText, setAiText] = useState("");
  async function load(event?: React.FormEvent) { event?.preventDefault(); setLoading(true); setError(""); setAiText(""); try { const result = await researchAsset(query, { fetchAsset: fetchMarketAssetBySymbol }); if (!result) throw new Error("not-found"); setResearch(result); } catch { setResearch(null); setError(t("research_error")); } finally { setLoading(false); } }
  async function ask() { if (!research) return; const turn = await askCopilot(`Analyze ${research.symbol}`); setAiText(turn.response.text); }
  return <div className="space-y-6">
    <form onSubmit={load} className="flex flex-col gap-3 sm:flex-row" role="search">
      <label className="sr-only" htmlFor="asset-search">{t("research_search")}</label>
      <input id="asset-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("research_search_placeholder")} className="min-h-11 flex-1 rounded-xl border border-border bg-background px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
      <button disabled={loading || !query.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50"><Search className="h-4 w-4" />{loading ? t("research_loading") : t("research_analyze")}</button>
    </form>
    {error && <div role="alert" className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-4"><span>{error}</span><button onClick={() => load()} className="inline-flex items-center gap-2 underline"><RefreshCw className="h-4 w-4" />{t("research_retry")}</button></div>}
    {!research && !error && !loading && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">{t("research_empty")}</div>}
    {research && <>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm" aria-labelledby="asset-title">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-bold text-primary">{research.assetType.toUpperCase()}</p><h2 id="asset-title" className="text-2xl font-extrabold">{research.name} <span dir="ltr">({research.symbol})</span></h2><p className="mt-2 text-xs text-muted-foreground"><Database className="me-1 inline h-3.5 w-3.5" />{research.provenance.source.replace("_", " ")} · {research.provenance.freshness} · {research.provenance.timestamp ?? unavailable(language)}</p></div><div className="text-end"><p className="text-3xl font-black" dir="ltr">{research.quote.price.toFixed(2)} {research.quote.currency ?? ""}</p><p className={research.quote.changePercent >= 0 ? "text-emerald-600" : "text-destructive"} dir="ltr">{research.quote.changePercent >= 0 ? "+" : ""}{research.quote.changePercent.toFixed(2)}%</p><p className="text-xs text-muted-foreground">{research.provenance.isMock ? t("research_simulated") : t("research_latest")}</p></div></div>
        <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">{[[t("research_previous"),research.quote.previousClose],[t("research_volume"),research.quote.volume],[t("research_status"),research.quote.marketStatus],[t("research_freshness"),t(`copilot_freshness_${research.provenance.freshness ?? "unavailable"}`, research.provenance.freshness)]].map(([label,value])=><div className="rounded-xl bg-muted/50 p-3" key={String(label)}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-bold" dir={typeof value === "number" ? "ltr" : undefined}>{value ?? unavailable(language)}</dd></div>)}</dl>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5"><h3 className="mb-4 text-lg font-bold">{t("research_history")}</h3>{research.history.length ? <div className="h-72" aria-label={t("research_history_chart")}><ResponsiveContainer width="100%" height="100%"><LineChart data={research.history}><XAxis dataKey="date" hide/><YAxis domain={["auto","auto"]} width={55}/><Tooltip/><Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" dot={false} strokeWidth={2}/></LineChart></ResponsiveContainer></div> : <p>{unavailable(language)}</p>}</div>
        <div className="rounded-2xl border border-border bg-card p-5"><h3 className="mb-4 text-lg font-bold">{t("research_indicators")}</h3><dl className="space-y-3">{Object.entries(research.indicators).map(([key,item])=><div key={key} className="flex items-center justify-between border-b border-border pb-2"><dt className="uppercase text-xs font-bold">{key.replace("Pct","")}</dt><dd dir="ltr">{item.status === "available" ? typeof item.value === "object" ? (item.value as { macd: number }).macd : item.value : unavailable(language)}</dd></div>)}</dl></div>
      </section>
      <section className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-border bg-card p-5"><h3 className="font-bold">{t("research_fundamentals")}</h3><p className="mt-2 text-sm text-muted-foreground">{unavailable(language)}. {research.fundamentals.reason}</p></div><div className="rounded-2xl border border-border bg-card p-5"><h3 className="font-bold">{t("research_news")}</h3><p className="mt-2 text-sm text-muted-foreground">{unavailable(language)}. {research.news.reason}</p></div></section>
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5"><h3 className="flex items-center gap-2 font-bold"><Bot className="h-5 w-5" />{t("research_ai")}</h3><p className="mt-2 text-sm text-muted-foreground">{t("research_ai_boundary")}</p><div className="mt-4 flex flex-wrap gap-3"><button onClick={ask} className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground">{t("research_ask")}</button><button onClick={() => setQuery(`${research.symbol} vs `)} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 font-bold"><GitCompareArrows className="h-4 w-4" />{t("research_compare")}</button></div>{aiText && <p className="mt-4 rounded-xl bg-background p-4 text-sm leading-7" aria-live="polite">{aiText}</p>}</section>
    </>}
  </div>;
}
