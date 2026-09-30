import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import type { SiteCapability } from "@/lib/copilot/siteCapabilities";

/** Launch cards rendered from the deterministic site map: name, one-line purpose, open link. */
export function ChatSiteLaunch({ capabilities }: { capabilities: SiteCapability[] }) {
  const { t } = useLanguage();
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {capabilities.map((cap) => (
        <li key={cap.id}>
          <Link to={cap.route} className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-bold text-primary hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            {t(`cap_${cap.id}_name`)}<ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
