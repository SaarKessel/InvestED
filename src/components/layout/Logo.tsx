import { cn } from "@/lib/utils";

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src="/logo-mark.png"
        alt=""
        width="32"
        height="32"
        className="h-8 w-8 rounded-lg shadow-sm"
      />
      {showWordmark && (
        <span dir="ltr" className="font-display text-lg font-extrabold tracking-tight text-[#B8862B] dark:text-[#E0B253]">
          InvestED+
        </span>
      )}
    </span>
  );
}
