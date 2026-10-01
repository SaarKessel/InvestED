import { useLanguage } from "@/context/languageContext";
import type { ScenarioPart } from "@/lib/copilot/scenarioDesk";
import { ChatCalcCard } from "./ChatCalcCard";
import { ChatMathCard } from "./ChatMathCard";

/** Each part of a long question, in order, with its own fixed-engine result. Unreadable parts are named, not guessed. */
export function ChatScenarioCard({ parts }: { parts: ScenarioPart[] }) {
  const { language } = useLanguage();
  const he = language === "he";
  return (
    <div className="mt-3 space-y-3">
      {parts.map((p, i) => (
        <div key={i}>
          <p className="text-[11px] font-semibold text-muted-foreground"><span>{he ? `חלק ${i + 1}` : `Part ${i + 1}`}</span> · <span dir="auto">{p.text}</span></p>
          {p.kind === "calc" && <ChatCalcCard data={p.calc} />}
          {p.kind === "math" && <ChatMathCard data={p.math} />}
          {p.kind === "skipped" && <p className="mt-1 rounded-lg border border-border/70 bg-background/70 p-2.5 text-xs font-semibold">{he ? "לא חישבתי את החלק הזה: אי אפשר לקרוא אותו בצורה בטוחה כחישוב." : "I did not calculate this part: it cannot be read safely as a calculation."}</p>}
        </div>
      ))}
    </div>
  );
}
