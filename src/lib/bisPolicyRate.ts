/** Historical BIS monthly end-of-period Israel policy rates, not current loan offers. */
export const BIS_RATE_SERIES = 'https://data.bis.org/topics/CBPOL';
export const BIS_RATE_TERMS = 'https://data.bis.org/help/legal';
export const BIS_RATE_METHODOLOGY = 'https://www.bis.org/statistics/cbpol/cbpol_doc.pdf';
export const BIS_RATE_API = 'https://stats.bis.org/api/v2/data/dataflow/BIS/WS_CBPOL/1.0/M.IL';
export interface BisRatePoint { month: string; rate: number }
export function parseBisMonthlyRates(xml: string): BisRatePoint[] {
  if (xml.length > 200_000) return [];
  const series = /<[^>]*\bSeries\b([^>]*)>([\s\S]*?)<\/[^>]*\bSeries\s*>/.exec(xml);
  if (!series || !/\bFREQ="M"/.test(series[1]) || !/\bREF_AREA="IL"/.test(series[1])) return [];
  const points: BisRatePoint[] = [];
  const observations = /<[^>]*\bObs\b([^>]*)(?:\/\s*>|>[\s\S]*?<\/[^>]*\bObs\s*>)/g;
  for (const match of series[2].matchAll(observations)) {
    const month = /\bTIME_PERIOD="(\d{4}-\d{2})"/.exec(match[1])?.[1];
    const rate = /\bOBS_VALUE="(-?\d+(?:\.\d+)?)"/.exec(match[1])?.[1];
    const n = Number(rate);
    if (!month || !/^(19|20)\d\d-(0[1-9]|1[0-2])$/.test(month) || rate === undefined || !Number.isFinite(n) || n < -10 || n > 100) continue;
    points.push({ month, rate: n });
  }
  return [...new Map(points.map(point => [point.month, point])).values()].sort((a, b) => a.month.localeCompare(b.month)).slice(-24);
}
