import { Link } from "react-router-dom";
import { useLanguage } from "@/context/languageContext";
import { buildLearningPath } from "@/lib/copilot/learnDesk";

/** The site's own learning roadmap, read-only, with a door into the Learn page. */
export function ChatLearnPath() {
  const { t, language } = useLanguage();
  const stages = buildLearningPath(language === "he" ? "he" : "en");
  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-3 text-xs">
      <p className="font-semibold">{t("learnpath_title")}</p>
      <ol className="mt-2 space-y-2">
        {stages.map((s) => <li key={s.stage}><p className="font-semibold">{s.stage}: {s.title}</p><p className="mt-0.5 text-muted-foreground">{s.topics.join(" · ")}</p></li>)}
      </ol>
      <Link to="/learn" className="mt-3 inline-block font-semibold text-primary hover:underline">{t("learnpath_open")}</Link>
    </div>
  );
}
