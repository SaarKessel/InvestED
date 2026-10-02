import { useEffect, useState } from "react";
import { useLanguage } from "@/context/languageContext";
import { fetchRssNews, type RssNewsResult } from "@/lib/news/rssClient";

/** Official announcements from public RSS feeds (central banks, regulators). Headline, publisher and time, linking out. Unavailable is shown plainly; nothing is substituted. */
export function OfficialFeedsSection() {
  const { language } = useLanguage();
  const he = language === "he";
  const l = he ? "he" : "en";
  const [state, setState] = useState<{ loading: boolean; result: RssNewsResult | null }>({ loading: true, result: null });
  useEffect(() => {
    let cancelled = false;
    fetchRssNews().then((result) => { if (!cancelled) setState({ loading: false, result }); });
    return () => { cancelled = true; };
  }, []);
  const { loading, result } = state;
  const down = result?.feeds.filter((f) => !f.ok) ?? [];
  return (
    <section className="mt-12" data-testid="official-feeds" dir={he ? "rtl" : "ltr"}>
      <h2 className="text-xl font-bold">{he ? "הודעות רשמיות (RSS ציבורי)" : "Official announcements (public RSS)"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{he ? "כותרות מהזנות RSS ציבוריות של הפדרל ריזרב, ה-SEC, הבנק המרכזי האירופי ובנק אנגליה. כותרת וקישור בלבד, עם המפרסם והזמן. זה לא מחירי שוק." : "Headlines from the public RSS feeds of the Federal Reserve, the SEC, the European Central Bank and the Bank of England. Headline and link only, with publisher and time. These are not market prices."}</p>
      {loading && <p className="mt-4 text-sm text-muted-foreground">{he ? "טוען הודעות רשמיות..." : "Loading official announcements..."}</p>}
      {!loading && (!result || !result.available) && (
        <p className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">{he ? "ההודעות הרשמיות לא זמינות כרגע. לא יוצג דבר עד שמקור אמיתי יענה." : "Official announcements are unavailable right now. Nothing is shown until a real source responds."}</p>
      )}
      {result && result.available && (
        <ul className="mt-4 space-y-3">
          {result.items.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-card p-4">
              <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold hover:underline" dir="auto">{item.title}</a>
              <p className="mt-1 text-xs text-muted-foreground">
                <span>{item.source}</span> · <span>{item.eventLabel[l]}</span> · <time dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleString(he ? "he-IL" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" })}</time>
              </p>
            </li>
          ))}
        </ul>
      )}
      {result && down.length > 0 && result.available && (
        <p className="mt-3 text-xs text-muted-foreground" data-testid="official-feeds-down">{he ? "לא זמין כרגע: " : "Unavailable right now: "}{down.map((f) => f.publisher).join(", ")}</p>
      )}
    </section>
  );
}
