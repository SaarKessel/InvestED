import { useEffect, useState } from "react";
import { useLanguage } from "@/context/languageContext";
import { easternParts, tickerPhase } from "@/lib/tickerStrip";
import { loadState, markShown, normalizePopupNews, pickPopup, saveState, type PopupNews } from "@/lib/newsPopup";

const WATCH = "SPY,QQQ,AAPL,MSFT,NVDA,AMZN,GOOGL,TSLA";
const params = () => (typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search));

/** Small card for a major headline on a watched stock. Summary is an AI rephrase of the headline only, labelled as such. */
export function NewsPopup() {
  const { t, language } = useLanguage();
  const [item, setItem] = useState<PopupNews | null>(null);
  const [summary, setSummary] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const preview = params().get("news") === "preview";
    let alive = true;
    const check = async () => {
      const now = new Date();
      if (!preview && tickerPhase(now) === "closed") return;
      try {
        const r = await fetch(`/api/news?symbols=${WATCH}`);
        if (!r.ok || !alive) return;
        let list = normalizePopupNews(await r.json());
        const state = loadState();
        const day = easternParts(now).ymd;
        if (preview) { const first = list[0]; list = first ? [{ ...first, publishedAt: now.toISOString(), eventType: "earnings", symbols: first.symbols.length ? first.symbols : ["AAPL"] }] : []; }
        const pick = pickPopup(list, now.getTime(), day, preview ? { ...state, seen: [], lastShownAt: 0, off: false } : state);
        if (!pick || !alive) return;
        if (!preview) saveState(markShown(state, pick.id, now.getTime(), day));
        setSummary(undefined); setItem(pick);
        try {
          const s = await fetch("/api/news-summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: pick.title, source: pick.source, eventLabel: pick.eventType.replace(/_/g, " "), language }) });
          const j = (await s.json()) as { text?: string };
          if (alive) setSummary(typeof j.text === "string" ? j.text : null);
        } catch { if (alive) setSummary(null); }
      } catch { /* no popup without real news */ }
    };
    const first = window.setTimeout(check, 8000);
    const id = window.setInterval(check, 10 * 60 * 1000);
    return () => { alive = false; window.clearTimeout(first); window.clearInterval(id); };
  }, [language]);
  if (!item) return null;
  const off = () => { saveState({ ...loadState(), off: true }); setItem(null); };
  return (
    <div role="dialog" aria-label={t("newspop_title")} className="fixed bottom-4 end-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[#E0B253]/40 bg-[#0b1630] p-4 text-sm text-slate-100 shadow-2xl">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#E0B253]">{t("newspop_title")}</span>
        <button type="button" onClick={() => setItem(null)} aria-label={t("newspop_dismiss")} className="-m-1 rounded p-1 text-slate-300 hover:text-white">✕</button>
      </div>
      <p className="mt-2 font-semibold leading-snug">{item.title}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-300">
        {summary === undefined ? t("newspop_loading") : summary ?? t("newspop_nosummary")}
      </p>
      {summary ? <p className="mt-1 text-[10px] uppercase tracking-wide text-[#E0B253]/80">{t("newspop_label")}</p> : null}
      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-300 underline">{t("newspop_source")}: {item.source}</a>
        <button type="button" onClick={off} className="text-slate-400 underline">{t("newspop_off")}</button>
      </div>
      <p className="mt-2 text-[10px] text-slate-400">{t("newspop_note")}</p>
    </div>
  );
}
