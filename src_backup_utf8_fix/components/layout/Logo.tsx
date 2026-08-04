import { cn } from "@/lib/utils";

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="9" fill="url(#invested-logo-gradient)" />
        <path
          d="M8 20L13 14L17 17L24 9"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M19 9H24V14" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="invested-logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22B17D" />
            <stop offset="1" stopColor="#3ECFFF" />
          </linearGradient>
        </defs>
      </svg>
      {showWordmark && <span className="font-display text-lg font-extrabold tracking-tight">InvestED</span>}
    </span>
  );
}

