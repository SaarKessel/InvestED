import { useCallback, useEffect, useRef, useState } from "react";
import { Newspaper, RefreshCw } from "lucide-react";
import { Layout, DisclaimerBanner } from "@/components/layout/Layout";
import { OfficialFeedsSection } from "@/components/news/OfficialFeedsSection";
import { NewsCard } from "@/components/news/NewsCard";
import { EvidenceWorksheetPanel } from "@/components/literacy/EvidenceWorksheet";
import { useLanguage } from "@/context/languageContext";
import { fetchNews, type NewsResult } from "@/lib/newsClient";
import { fetchHeadlineSentiment, type SentimentItem } from "@/lib/news/sentiment";
import { shouldRefreshNews } from "@/lib/newsRefresh";

export default function NewsPage() {
  const { t, language } = useLanguage();
  const [result, setResult] = useState<NewsResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tones, setTones] = useState<Map<string, SentimentItem> | null>(null);

  const resultRef = useRef<NewsResult | null>(null);
  const loadingRef = useRef(false);

  const load = useCallback(() => {
    if (loadingRef.current || document.visibilityState === "hidden") return;
    loadingRef.current = true;
    setRefreshing(true);
    fetchNews()
      .then((payload) => {
        resultRef.current = payload;
        setResult(payload);
        setFailed(false);
      })
      .catch(() => setFailed(true))
      .finally(() => {
        loadingRef.current = false;
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    if (!result?.available) return;
    let live = true;
    fetchHeadlineSentiment(result.items, language === "he" ? "he" : "en").then((m) => { if (live) setTones(m); });
    return () => { live = false; };
  }, [result, language]);

  useEffect(() => {
    load();
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const current = resultRef.current;
      if (shouldRefreshNews(current?.fetchedAt ?? null, Date.now(), current?.cacheTtlSeconds ?? 900)) load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  return (
    <Layout>
      <section className="container max-w-5xl py-8 md:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">
              <Newspaper className="h-4 w-4" />
              {t("news_page_tag")}
            </div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">{t("news_page_title")}</h1>
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{t("news_page_subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={refreshing}
            aria-label={t("news_refresh")}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {result && (
              <span className="text-xs">
                {t("news_fetched_at")}:{" "}
                {new Date(result.fetchedAt).toLocaleString(language === "he" ? "he-IL" : "en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Jerusalem",
                })}
              </span>
            )}
          </button>
        </div>

        <EvidenceWorksheetPanel />

        {!result && !failed && (
          <p className="py-16 text-center text-sm text-muted-foreground">{t("news_loading")}</p>
        )}

        {(failed || (result && !result.available)) && (
          <p className="rounded-xl border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            {t("news_unavailable")}
          </p>
        )}

        {result && result.available && (
          <div className="grid gap-5 md:grid-cols-2">
            {result.items.map((item) => (
              <NewsCard key={item.id} item={item} tone={tones?.get(item.id)} />
            ))}
          </div>
        )}

        <OfficialFeedsSection />

        <p className="mt-8 text-xs leading-5 text-muted-foreground">{t("news_cache_note")}</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("news_educational_note")}</p>
        <DisclaimerBanner className="mt-6" />
      </section>
    </Layout>
  );
}
