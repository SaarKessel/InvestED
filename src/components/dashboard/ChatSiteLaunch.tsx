import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import type { SiteCapability } from "@/lib/copilot/siteCapabilities";

/** Launch cards rendered from the deterministic site map: name, one-line purpose, open link. */
export function ChatSiteLaunch({ capabilities }: { capabilities: SiteCapability[] }) {
  const { t } = useLanguage();
  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
      {capabilities.map((cap) => (
        <li key={cap.id}>
          <Link to={cap.route} className="flex h-full items-start justify-between gap-2 rounded-lg border border-border bg-background/70 p-2.5 text-xs hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            <span><span className="block font-bold text-primary">{t(`cap_${cap.id}_name`)}</span><span className="mt-0.5 block text-muted-foreground">{t(`cap_${cap.id}_desc`)}</span></span>
            <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-primary">{t("cap_open_action")}<ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" /></span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
