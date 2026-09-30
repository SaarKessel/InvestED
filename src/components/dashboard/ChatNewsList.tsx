// Facelift phase 2: in-chat related-news list. For turns about specific
// assets, shows the latest items from InvestED's own deterministic news
// feed (/api/news, yahoo_finance_search) that mention those symbols.
// Read-only; renders nothing when the feed has no matching items.
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/languageContext";
import { fetchNews, type NewsItem } from "@/lib/newsClient";

export function ChatNewsList({ symbols }: { symbols: string[] }) {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const key = symbols.join(",");
  useEffect(() => {
    const wanted = new Set(key.split(",").filter(Boolean).map((symbol) => symbol.toUpperCase()));
    if (wanted.size === 0) return;
    let cancelled = false;
    fetchNews()
      .then((payload) => {
        if (cancelled) return;
        setItems(
          payload.available
            ? payload.items.filter((item) => item.symbols.some((symbol) => wanted.has(symbol.toUpperCase()))).slice(0, 3)
            : []
        );
      })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, [key]);
  if (!items || items.length === 0) return null;
  const locale = language === "he" ? "he-IL" : "en-US";
  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-2.5 text-xs">
      <p className="mb-2 font-semibold">{t("copilot_news_title")}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <a href={item.url} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
              {item.title}
            </a>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {item.source} · {new Date(item.publishedAt).toLocaleString(locale, { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
