import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Bookmark, GraduationCap } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { AGENTS } from "@/lib/agents";
import { fetchMarketMovers, type MarketMoversResult } from "@/lib/marketMovers";
import { getLearningProgress } from "@/lib/learningProgressStorage";
import type { SavedAnswer } from "@/lib/copilot/savedAnswers";

const card = "rounded-2xl border border-border/70 bg-muted/30 p-3 text-start text-xs";

/** Home cockpit: small read-only cards. Every card opens a question in the chat; nothing here computes a number. */
export function ChatCockpit({ saved, onAsk }: { saved: SavedAnswer[]; onAsk: (q: string) => void }) {
  const { t, language } = useLanguage();
  const [movers, setMovers] = useState<MarketMoversResult | null>(null);
  const [failed, setFailed] = useState(false);
  const learned = getLearningProgress().length;
  useEffect(() => {
    let off = false;
    fetchMarketMovers().then((r) => { if (!off) setMovers(r); }).catch(() => { if (!off) setFailed(true); });
    return () => { off = true; };
  }, []);
  const rows = movers?.available ? [...movers.gainers.slice(0, 2), ...movers.losers.slice(0, 2)] : [];
  return (
    <section aria-label={t("cockpit_title")} className="mb-6 grid gap-2 sm:grid-cols-2" data-testid="cockpit">
      <div className={card}>
        <p className="font-semibold">{t("cockpit_market")}</p>
        {rows.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {rows.map((m) => {
              const up = (m.changePercent ?? 0) >= 0;
              return <li key={m.symbol}><button type="button" onClick={() => onAsk(`${m.symbol} stock`)} className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-0.5 hover:bg-accent">
                <span className="font-bold" dir="ltr">{m.symbol}</span>
                <span dir="ltr" className={`inline-flex items-center gap-1 font-bold ${up ? "text-green-500" : "text-red-500"}`}>{up ? <TrendingUp className="h-3 w-3" aria-hidden="true" /> : <TrendingDown className="h-3 w-3" aria-hidden="true" />}{m.changePercent === null ? "—" : `${up ? "+" : ""}${m.changePercent.toFixed(2)}%`}</span>
              </button></li>;
            })}
          </ul>
        ) : <p className="mt-2 text-muted-foreground">{failed || (movers && !movers.available) ? t("cockpit_market_off") : t("cockpit_loading")}</p>}
        {rows.length > 0 && <p className="mt-2 text-[10px] text-muted-foreground">{t("cockpit_market_note")}</p>}
      </div>
      <div className={card}>
        <p className="inline-flex items-center gap-1 font-semibold"><GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />{t("cockpit_learning")}</p>
        <p className="mt-2 text-muted-foreground">{learned > 0 ? t("cockpit_learned").replace("{n}", String(learned)) : t("cockpit_learned_none")}</p>
        <button type="button" onClick={() => onAsk(t("cockpit_learn_prompt"))} className="mt-2 rounded-full border border-border px-2.5 py-1 font-medium text-primary hover:border-primary">{t("cockpit_learn_cta")}</button>
      </div>
      <div className={card}>
        <p className="inline-flex items-center gap-1 font-semibold"><Bookmark className="h-3.5 w-3.5" aria-hidden="true" />{t("cockpit_saved")}</p>
        {saved.length > 0 ? (
          <ul className="mt-2 space-y-1">{saved.slice(0, 3).map((s) => <li key={s.id}><button type="button" onClick={() => onAsk(s.question)} className="w-full truncate rounded-lg px-1 py-0.5 text-start hover:bg-accent">{s.question}</button></li>)}</ul>
        ) : <p className="mt-2 text-muted-foreground">{t("cockpit_saved_none")}</p>}
      </div>
      <div className={card}>
        <p className="font-semibold">{t("cockpit_agents")}</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {AGENTS.map((a) => <li key={a.id}><button type="button" onClick={() => onAsk(a.starters[0][language === "he" ? "he" : "en"])} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium hover:bg-accent" style={{ borderColor: `hsl(${a.color} / 0.6)` }}><span className="h-2 w-2 rounded-full" style={{ background: `hsl(${a.color})` }} aria-hidden="true" />{a.name[language === "he" ? "he" : "en"]}</button></li>)}
        </ul>
      </div>
    </section>
  );
}
