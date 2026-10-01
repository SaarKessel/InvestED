import { useLanguage } from "@/context/languageContext";
import { getAgent } from "@/lib/agents";

/** Small coloured label above an answer: which agent's topic it belongs to. A suggestion line appears when a picked agent is asked another agent's topic. */
export function ChatAgentTag({ agentId, switchTo, onSwitch }: { agentId: string | null; switchTo?: string; onSwitch: (id: string) => void }) {
  const { language } = useLanguage();
  const lang = language === "he" ? "he" : "en";
  const agent = getAgent(agentId);
  const other = getAgent(switchTo);
  if (!agent && !other) return null;
  return (
    <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
      {agent && <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: `hsl(${agent.color})` }}><span className="h-2 w-2 rounded-full" style={{ background: `hsl(${agent.color})` }} aria-hidden="true" />{agent.name[lang]}</span>}
      {other && <span className="text-muted-foreground">{lang === "he" ? `השאלה הזו שייכת לסוכן ${other.name.he}.` : `This question belongs to the ${other.name.en} agent.`} <button type="button" onClick={() => onSwitch(other.id)} className="font-semibold underline" style={{ color: `hsl(${other.color})` }}>{lang === "he" ? "לעבור?" : "Switch?"}</button></span>}
    </div>
  );
}
