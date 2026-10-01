// "Related Intelligence": neighbours of the concept just discussed, from the
// concept registry graph (deterministic). Only concepts that have an answer are
// offered, so a chip never leads to a dead end.
import { Link } from "react-router-dom";
import enLocale from "@/locales/en.json";
import heLocale from "@/locales/he.json";
import { CHAT_TOOLS } from "./chatTools";
import { findConceptsInText, relatedChips } from "@/lib/knowledge/concepts/registry";

export function ChatRelated({ question, onAsk }: { question: string; onAsk: (text: string) => void }) {
  const items = relatedChips(question);
  const concept = findConceptsInText(question, 1)[0];
  const dict = (/[א-ת]/.test(question) ? heLocale : enLocale) as Record<string, string>;
  const tools = (concept?.tools ?? []).map((path) => CHAT_TOOLS.find((x) => x.path === path)).filter((x) => x !== undefined).slice(0, 2);
  if (items.length === 0 && tools.length === 0) return null;
  return (
    <div className="mt-3" data-testid="related-intelligence">
      {items.length > 0 && (<>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{dict.related_title}</p>
        <ul className="flex flex-wrap gap-1.5">
          {items.map((c) => (
            <li key={c.id}><button type="button" onClick={() => onAsk(c.ask)} className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">{c.label}</button></li>
          ))}
        </ul>
      </>)}
      {tools.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={dict.related_try}>
          {tools.map((x) => <li key={x.id}><Link to={x.path} className="rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10">{dict.related_try} {dict[x.labelKey] ?? ""}</Link></li>)}
        </ul>
      )}
    </div>
  );
}
