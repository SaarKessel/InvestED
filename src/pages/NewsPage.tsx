import { useEffect, useState } from "react";
import { Newspaper, RefreshCw } from "lucide-react";
import { Layout, DisclaimerBanner } from "@/components/layout/Layout";
import { NewsCard } from "@/components/news/NewsCard";
import { useLanguage } from "@/context/languageContext";
import { fetchNews, type NewsResult } from "@/lib/newsClient";

export default function NewsPage() {
  const { t, language } = useLanguage();
  const [result, setResult] = useState<NewsResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  function load() {
    setRefreshing(true);
    fetchNews()
      .then((payload) => {
        setResult(payload);
        setFailed(false);
      })
      .catch(() => setFailed(true))
      .finally(() => setRefreshing(false));
  }

  useEffect(load, []);

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
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {result && (
              <span className="text-xs">
                {t("news_fetched_at")}:{" "}
                {new Date(result.fetchedAt).toLocaleString(language === "he" ? "he-IL" : "en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </button>
        </div>

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
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}

        <p className="mt-8 text-xs leading-5 text-muted-foreground">{t("news_educational_note")}</p>
        <DisclaimerBanner className="mt-6" />
      </section>
    </Layout>
  );
}
