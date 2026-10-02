import type { ReactNode } from "react";
export const inputCls = "mt-1 min-h-10 w-full rounded-lg border border-border bg-background p-2 text-sm";
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-medium">{label}{children}</label>;
}
export function Num({ label, value, set, step = "any", min }: { label: string; value: string; set: (v: string) => void; step?: string; min?: string }) {
  return <Field label={label}><input dir="ltr" type="number" inputMode="decimal" step={step} min={min} value={value} onChange={(e) => set(e.target.value)} className={inputCls} /></Field>;
}
export const parseNum = (s: string): number | null => (s.trim() !== "" && Number.isFinite(Number(s)) ? Number(s) : null);
export function Edu({ he }: { he: boolean }) {
  return <p className="text-xs text-muted-foreground">{he ? "חומר לימודי בלבד, לא ייעוץ השקעות. כל המספרים מגיעים מהנתונים שהזנתם." : "Educational only, not investment advice. Every number comes from what you entered."}</p>;
}
export const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section aria-label={title} className="space-y-3 rounded-2xl border border-border/60 bg-card/60 p-4"><h2 className="text-lg font-semibold">{title}</h2>{children}</section>
);
