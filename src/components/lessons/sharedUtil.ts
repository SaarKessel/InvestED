export const inputCls = "mt-1 min-h-10 w-full rounded-lg border border-border bg-background p-2 text-sm";
export const parseNum = (s: string): number | null => (s.trim() !== "" && Number.isFinite(Number(s)) ? Number(s) : null);
