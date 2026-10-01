// "Related Intelligence": neighbours of the concept just discussed, from the
// concept registry graph (deterministic). Only concepts that have an answer are
// offered, so a chip never leads to a dead end.
import { useLanguage } from "@/context/languageContext";
import { relatedChips } from "@/lib/knowledge/concepts/registry";

export function ChatRelated({ question, onAsk }: { question: string; onAsk: (text: string) => void }) {
  const { t } = useLanguage();
  const items = relatedChips(question);
  if (items.length === 0) return null;
  return (
    <div className="mt-3" data-testid="related-intelligence">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("related_title")}</p>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((c) => (
          <li key={c.id}><button type="button" onClick={() => onAsk(c.ask)} className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">{c.label}</button></li>
        ))}
      </ul>
    </div>
  );
}
