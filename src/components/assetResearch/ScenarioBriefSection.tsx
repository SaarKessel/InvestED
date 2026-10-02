import { useState } from "react";
import { Scale } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { fetchNews } from "@/lib/newsClient";
import type { AssetResearch } from "@/lib/research/assetResearchEngine";
import { buildBriefFacts, fetchScenarioBrief, type BriefFacts, type ScenarioBrief } from "@/lib/research/scenarioBrief";

type State = { facts: BriefFacts; brief: ScenarioBrief | null } | null;

export function ScenarioBriefSection({ research }: { research: AssetResearch }) {
  const { t, language } = useLanguage();
  const [state, setState] = useState<State>(null);
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    let headlines: { title: string; publishedAt: string }[] = [];
    try {
      const n = await fetchNews();
      if (n.available) headlines = n.items.filter((i) => i.symbols.includes(research.symbol)).map((i) => ({ title: i.title, publishedAt: i.publishedAt }));
    } catch { /* news stays unavailable and is listed as such */ }
    const facts = buildBriefFacts(research, headlines);
    const brief = await fetchScenarioBrief(facts, language === "he" ? "he" : "en");
    setState({ facts, brief });
    setBusy(false);
  }
  const lists: [string, string[]][] = state?.brief ? [["research_brief_positives", state.brief.positives], ["research_brief_concerns", state.brief.concerns], ["research_brief_outlook", state.brief.outlook]] : [];
  return (
    <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="brief-title" data-testid="scenario-brief">
      <h3 id="brief-title" className="flex items-center gap-2 font-bold"><Scale className="h-5 w-5" />{t("research_brief_title")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t("research_brief_note")}</p>
      <button type="button" onClick={run} disabled={busy} className="mt-4 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{busy ? t("research_loading") : t("research_brief_run")}</button>
      {state && (
        <div className="mt-4 space-y-4">
          {state.brief ? lists.filter(([, items]) => items.length > 0).map(([key, items]) => (
            <div key={key}><p className="text-sm font-bold">{t(key)} <span className="text-xs font-normal text-muted-foreground">({t("news_ai_tone_label")})</span></p><ul className="mt-1 list-disc space-y-1 ps-5 text-sm leading-6">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
          )) : <p className="text-sm text-muted-foreground" role="status">{t("research_brief_ai_off")}</p>}
          <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs font-bold">{t("research_brief_facts")}</p><ul className="mt-1 list-disc space-y-0.5 ps-5 text-xs text-muted-foreground" dir="ltr">{state.facts.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
            <p className="mt-2 text-xs font-bold">{t("research_brief_unavailable")}</p><ul className="mt-1 list-disc space-y-0.5 ps-5 text-xs text-muted-foreground" dir="ltr">{state.facts.unavailable.map((l, i) => <li key={i}>{l}</li>)}</ul></div>
        </div>
      )}
    </section>
  );
}
