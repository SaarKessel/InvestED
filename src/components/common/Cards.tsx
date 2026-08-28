import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  className?: string;
  valueClassName?: string;
}

export function MetricCard({ label, value, icon, className, valueClassName }: MetricCardProps) {
  return (
    <div className={cn(
      "group rounded-2xl border border-border/80 bg-background/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
      className
    )}>
      {icon && (
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1.5 font-bold", valueClassName)}>{value}</p>
    </div>
  );
}

interface InfoCardProps {
  title: string;
  value: string;
  className?: string;
}

export function InfoCard({ title, value, className }: InfoCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-background p-5", className)}>
      <p className="mb-2 text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

interface MiniCardProps {
  label: string;
  value: string;
  className?: string;
}

export function MiniCard({ label, value, className }: MiniCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-background p-4", className)}>
      <p className="mb-2 text-sm font-medium leading-5 text-muted-foreground">{label}</p>
      <p className="text-base font-bold leading-6 text-foreground">{value}</p>
    </div>
  );
}

interface EmptyStateCardProps {
  label: string;
  value: string;
  className?: string;
}

export function EmptyStateCard({ label, value, className }: EmptyStateCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-bold text-foreground">{value}</p>
    </div>
  );
}
