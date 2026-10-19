import { cn } from "@/lib/utils";

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src="/logo-mark-blue.png"
        alt=""
        width="32"
        height="32"
        className="h-8 w-8 rounded-lg shadow-sm"
      />
      {showWordmark && (
        <span dir="ltr" className="font-display text-lg font-extrabold tracking-tight text-[#2457c5] dark:text-[#8db4ff]">
          InvestED+
        </span>
      )}
    </span>
  );
}
