import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Newspaper, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { NewsCard } from "@/components/news/NewsCard";
import { useLanguage } from "@/context/languageContext";
import { fetchNews, type NewsResult } from "@/lib/newsClient";

export function AINewsSection() {
  const { t, dir } = useLanguage();
  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;
  const [result, setResult] = useState<NewsResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchNews()
      .then((payload) => {
        if (!cancelled) setResult(payload);
      })
      .catch(() => {
        if (!cancelled) setResult({ available: false, items: [], fetchedAt: new Date().toISOString() });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = result?.available ? result.items.slice(0, 3) : [];

  return (
    <section className="border-t border-border/60 bg-background py-24">
      <div className="container">
        <div className="mb-14 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">
            <Newspaper className="h-3.5 w-3.5" />
            {t("news_home_tag")}
          </span>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            {t("news_home_title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t("news_home_subtitle")}</p>
        </div>

        {!result && (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("news_loading")}</p>
        )}

        {result && items.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("news_unavailable")}</p>
        )}

        {items.length > 0 && (
          <div className="grid gap-5 md:grid-cols-3">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <NewsCard item={item} compact />
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link to="/news">
            <Button size="lg" variant="outline" className="group gap-2 rounded-xl px-7">
              {t("news_home_cta")}
              <ArrowIcon className={`h-4 w-4 transition-transform duration-200 ${dir === "rtl" ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
