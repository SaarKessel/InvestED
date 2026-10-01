export interface PricePoint { date: string; price: number }
export interface RebasedSeries { symbol: string; points: { date: string; value: number }[] }

/** Rebase each series to 100 on the first date every series has in common. Pure arithmetic on provider closes; null when there is no usable overlap. */
export function rebaseToHundred(input: { symbol: string; history: PricePoint[] }[]): RebasedSeries[] | null {
  if (input.length < 2) return null;
  const clean = input.map((s) => ({ symbol: s.symbol, rows: s.history.filter((h) => typeof h.date === "string" && Number.isFinite(h.price) && h.price > 0) }));
  if (clean.some((s) => s.rows.length < 2)) return null;
  const common = clean.map((s) => new Set(s.rows.map((r) => r.date))).reduce((a, b) => new Set([...a].filter((d) => b.has(d))));
  if (common.size < 2) return null;
  const dates = [...common].sort();
  return clean.map((s) => {
    const byDate = new Map(s.rows.map((r) => [r.date, r.price]));
    const base = byDate.get(dates[0])!;
    return { symbol: s.symbol, points: dates.map((d) => ({ date: d, value: (byDate.get(d)! / base) * 100 })) };
  });
}
