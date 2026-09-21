import { ExternalLink, Newspaper, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/primitives";
import { useLanguage } from "@/context/languageContext";
import type { NewsItem } from "@/lib/newsClient";

export function NewsCard({ item, compact = false }: { item: NewsItem; compact?: boolean }) {
  const { t, language } = useLanguage();
  const lang = language === "he" ? "he" : "en";
  const implications = item.implications[lang];
  const keyFacts = item.keyFacts[lang];
  const published = new Date(item.publishedAt).toLocaleString(lang === "he" ? "he-IL" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 font-bold text-primary">
            <Tag className="h-3 w-3" />
            {item.eventLabel[lang]}
          </span>
          <span className="text-muted-foreground">
            {item.source} • {published}
          </span>
        </div>

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group text-base font-bold leading-6 text-foreground hover:text-primary"
          dir="ltr"
        >
          <span className="inline-flex items-start gap-1.5">
            {item.title}
            <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
        </a>

        {item.symbols.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.symbols.map((symbol) => (
              <span key={symbol} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground" dir="ltr">
                {symbol}
              </span>
            ))}
          </div>
        )}

        {!compact && (
          <div className="mt-4 space-y-1.5 border-t border-border/60 pt-3">
            {keyFacts.map((fact) => (
              <p key={fact.label} className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{fact.label}: </span>
                {fact.value}
              </p>
            ))}
          </div>
        )}

        {!compact && (
          <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-3.5">
            <p className="text-xs font-bold text-foreground">{t("news_implications_title")}</p>
            {implications.length === 0 ? (
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{t("news_no_implications")}</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {implications.map((implication, index) => (
                  <li key={index} className="text-xs leading-5 text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {t(`news_scope_${implication.scope}`)}:{" "}
                    </span>
                    {implication.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-auto pt-4">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <Newspaper className="h-3.5 w-3.5" />
            {t("news_read_original")}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
