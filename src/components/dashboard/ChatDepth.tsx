import { useLanguage } from "@/context/languageContext";
import type { DepthSection } from "@/lib/copilot/depth";
import { trustLabel } from "@/lib/copilot/planner";

/** Extra passes for the JUNIOR, SENIOR and PROFESSIONAL tracks. Each block names its trust class. */
export function ChatDepth({ sections }: { sections: DepthSection[] }) {
  const { language } = useLanguage();
  const lang = language === "he" ? "he" : "en";
  if (!sections.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {sections.map((s) => (
        <div key={s.id} className="rounded-lg border border-border/70 bg-background/70 p-2.5 text-xs">
          <p className="font-semibold">{s.title[lang]} <span className="ms-1 font-normal text-muted-foreground">· {trustLabel(s.trust, lang)}</span></p>
          <ul className="mt-1 list-disc space-y-1 ps-5 text-muted-foreground">{s.lines.map((l, i) => <li key={i}>{l[lang]}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}
