/**
 * Country statistics from the World Bank open data API (CC BY 4.0, free, no key), through our own /api/worldbank pass-through because the browser cannot call it reliably.
 * Yearly values, published with a delay, so the card shows the year of every number.
 */
import { isNegatedAsk } from "./negatedAsk";

export type WbIndicator = "inflation" | "gdp_growth" | "unemployment" | "gdp";
export interface WbRequest { indicator: WbIndicator; country: string; countryName: { en: string; he: string } }
export interface WbPoint { year: string; value: number }
export interface WbResult extends WbRequest { points: WbPoint[]; lastUpdated: string }

const IND: Record<WbIndicator, { code: string; unit?: "usd"; re: RegExp; label: { en: string; he: string } }> = {
  inflation: { code: "FP.CPI.TOTL.ZG", re: /inflation|\bcpi\b|consumer prices?|אינפלציה|עליית מחירים|מדד המחירים/i, label: { en: "Inflation, consumer prices (annual %)", he: "אינפלציה, מדד המחירים לצרכן (שנתי, %)" } },
  gdp_growth: { code: "NY.GDP.MKTP.KD.ZG", re: /gdp growth|economic growth|צמיחה|צמיחת/i, label: { en: "GDP growth (annual %)", he: "צמיחת התוצר (שנתי, %)" } },
  unemployment: { code: "SL.UEM.TOTL.ZS", re: /unemployment|jobless|אבטלה/i, label: { en: "Unemployment (% of labor force)", he: "אבטלה (% מכוח העבודה)" } },
  // listed last so "GDP growth" matches the growth indicator first
  gdp: { code: "NY.GDP.MKTP.CD", unit: "usd", re: /\bgdp\b|gross domestic product|תוצר/i, label: { en: "GDP (current US$)", he: "תוצר (דולר נוכחי)" } },
};
/** One value as the card and the depth lines print it: percent for rates, dollars in billions or trillions for GDP. */
export function formatWbValue(i: WbIndicator, v: number, digits = 1): string {
  if (IND[i].unit === "usd") return Math.abs(v) >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : `$${(v / 1e9).toFixed(1)}B`;
  return `${Number(v.toFixed(digits))}%`;
}
export const wbLabel = (i: WbIndicator) => IND[i].label;

const COUNTRIES: { iso: string; re: RegExp; name: { en: string; he: string } }[] = [
  { iso: "ISR", re: /\bisrael(?:i)?\b|ישראל/i, name: { en: "Israel", he: "ישראל" } },
  { iso: "USA", re: /(?<!\b(?:tell|show|give|send|help|let|ask|remind|teach)\s)\bus\b|\bu\.s\.(?:a\.)?|\busa\b|united states|america|ארה["״'׳]?ב|\bthe states\b|ארצות הברית|אמריקה/i, name: { en: "United States", he: "ארצות הברית" } },
  { iso: "GBR", re: /\buk\b|\bu\.k\.?(?!\w)|united kingdom|britain|british|בריטניה/i, name: { en: "United Kingdom", he: "בריטניה" } },
  { iso: "DEU", re: /german(?:y)?|גרמניה/i, name: { en: "Germany", he: "גרמניה" } },
  { iso: "EMU", re: /euro\s?(?:area|zone)|גוש היורו/i, name: { en: "Euro area", he: "גוש היורו" } },
  { iso: "JPN", re: /japan|יפן/i, name: { en: "Japan", he: "יפן" } },
  { iso: "CHN", re: /china|chinese|סין/i, name: { en: "China", he: "סין" } },
  { iso: "IND", re: /\bindia(?:n)?\b|הודו/i, name: { en: "India", he: "הודו" } },
];

/** Needs both an indicator word and a named country; otherwise the question goes to the normal explanation. */
export function parseWbRequest(text: string): WbRequest | null {
  if (text.length > 120 || isNegatedAsk(text)) return null;
  const ind = (Object.keys(IND) as WbIndicator[]).find((k) => IND[k].re.test(text));
  const c = COUNTRIES.find((x) => x.re.test(text));
  if (!ind || !c) return null;
  if (/per capita|לנפש/i.test(text)) return null;
  if (/what is|מה זה|מהי|מהו|explain|הסבר/i.test(text) && !/\b(?:in|of|rate)\b|\bב(?=[א-ת])|של/i.test(text)) return null;
  return { indicator: ind, country: c.iso, countryName: c.name };
}

export async function loadWb(req: WbRequest, fetcher: typeof fetch = fetch): Promise<WbResult | null> {
  try {
    const r = await fetcher(`/api/worldbank?country=${req.country}&code=${IND[req.indicator].code}`);
    if (!r.ok) return null;
    const j = (await r.json()) as [{ lastupdated?: string }, { date: string; value: number | null }[] | null];
    const rows = (j[1] ?? []).filter((x) => typeof x.value === "number") as { date: string; value: number }[];
    if (!rows.length) return null;
    return { ...req, points: rows.map((x) => ({ year: x.date, value: x.value })).sort((a, b) => a.year.localeCompare(b.year)), lastUpdated: j[0]?.lastupdated ?? "" };
  } catch { return null; }
}
