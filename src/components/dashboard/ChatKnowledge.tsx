import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { isStaleNote, type KnowledgeItem } from "@/lib/knowledge/knowledge";
import { submitFeedback } from "@/lib/knowledge/knowledgeClient";

/** Stored notes shown verbatim with source and date. Nothing here is generated. */
export function ChatKnowledge({ items }: { items: KnowledgeItem[] }) {
  const { t } = useLanguage();
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">{t("kb_from")}</p>
      {items.map((k) => (
        <div key={k.id} className="rounded-lg border border-border/70 bg-background/70 p-3 text-xs">
          <p className="font-semibold">{k.title}</p>
          <p className="mt-1 whitespace-pre-line leading-6">{k.body}</p>
          <p className="mt-2 text-muted-foreground">
            {k.source_url ? <a href={k.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{k.source_label}</a> : k.source_label}
            {k.published_at ? ` · ${k.published_at}` : ""}
          </p>
          {isStaleNote(k.published_at) && <p role="note" className="mt-1 font-semibold text-amber-500">{t("kb_stale")}</p>}
        </div>
      ))}
    </div>
  );
}

export function FeedbackButtons({ question, knowledgeIds, lang }: { question: string; knowledgeIds: string[]; lang: string }) {
  const { t } = useLanguage();
  const [sent, setSent] = useState<1 | -1 | null>(null);
  async function rate(v: 1 | -1) { if (sent) return; setSent(v); const ok = await submitFeedback(question, v, knowledgeIds, lang); if (!ok) setSent(null); }
  const base = "inline-flex items-center rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-100";
  return (
    <span className="ms-3 inline-flex items-center gap-1 align-middle" role="group" aria-label={t("kb_rate")}>
      <button type="button" disabled={!!sent} onClick={() => void rate(1)} aria-label={t("kb_good")} title={t("kb_good")} className={`${base} ${sent === 1 ? "text-primary" : ""}`}><ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" /></button>
      <button type="button" disabled={!!sent} onClick={() => void rate(-1)} aria-label={t("kb_bad")} title={t("kb_bad")} className={`${base} ${sent === -1 ? "text-destructive" : ""}`}><ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" /></button>
      {sent && <span className="text-[11px] text-muted-foreground">{t("kb_thanks")}</span>}
    </span>
  );
}
