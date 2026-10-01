import { Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { EmbedContext } from "@/components/layout/embed";
import { useLanguage } from "@/context/languageContext";
import { toolForPath } from "./chatTools";

/** A former site page, opened inside the chat thread as a card that belongs to the conversation. */
export function ChatToolPanel() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const hit = toolForPath(pathname);
  if (!hit) return null;
  const Page = hit.page;
  return (
    <section aria-label={hit.tool ? t(hit.tool.labelKey) : undefined} data-testid="chat-tool-panel" className="chat-tool-panel overflow-hidden rounded-3xl border border-border/60 bg-card/60">
      <div className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-2.5">
        <p className="text-sm font-semibold">{hit.tool ? t(hit.tool.labelKey) : ""}</p>
        <button type="button" onClick={() => navigate("/")} aria-label={t("tool_close")} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"><X className="h-4 w-4" aria-hidden="true" /></button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto">
        <EmbedContext.Provider value>
          <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">{t("copilot_working")}</div>}><Page /></Suspense>
        </EmbedContext.Provider>
      </div>
    </section>
  );
}
