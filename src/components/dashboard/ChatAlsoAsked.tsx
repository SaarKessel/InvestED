// Parts of a long question the main answer did not cover: stored plain explanations and tool pointers (no new numbers).
import { Link } from "react-router-dom";
import enLocale from "@/locales/en.json";
import heLocale from "@/locales/he.json";
import { CHAT_TOOLS } from "./chatTools";
import { alsoAnswered, toolHints } from "@/lib/copilot/multiPart";

export function ChatAlsoAsked({ question, answer }: { question: string; answer: string }) {
  const he = /[א-ת]/.test(question);
  const dict = (he ? heLocale : enLocale) as Record<string, string>;
  const items = alsoAnswered(question, answer);
  const hints = toolHints(question);
  if (items.length === 0 && hints.length === 0) return null;
  return (
    <div className="mt-3 space-y-2 border-t border-border/50 pt-3" data-testid="also-asked">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{dict.also_title}</p>
      {items.map((i) => (<div key={i.id}><p className="text-sm font-semibold">{i.label}</p><p className="text-sm leading-6">{i.text}</p></div>))}
      {hints.map((h) => {
        const tool = CHAT_TOOLS.find((x) => x.id === h.toolId);
        return (<p key={h.toolId} className="text-sm leading-6 text-muted-foreground">{he ? h.he : h.en}{tool && <> <Link to={tool.path} className="font-medium text-primary hover:underline">{dict.related_try}</Link></>}</p>);
      })}
    </div>
  );
}
