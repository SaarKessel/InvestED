import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/languageContext";

interface DisclaimerProps {
  className?: string;
  variant?: "banner" | "inline" | "footer";
}

export function Disclaimer({ className, variant = "inline" }: DisclaimerProps) {
  const { t } = useLanguage();

  const variants = {
    banner: "border border-yellow-500/30 bg-yellow-500/5 rounded-xl p-4",
    inline: "text-xs leading-relaxed text-muted-foreground",
    footer: "text-xs leading-relaxed text-muted-foreground text-center",
  };

  if (variant === "banner") {
    return (
      <div className={cn(variants[variant], className)}>
        <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-500">
          {t("disclaimer_banner_bold")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("disclaimer_banner_text")}
        </p>
      </div>
    );
  }

  return (
    <p className={cn(variants[variant], className)}>
      {t("footer_disclaimer")}
    </p>
  );
}
