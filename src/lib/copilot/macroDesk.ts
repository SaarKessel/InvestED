/**
 * Official macro data in the chat, keyless: the ECB main refinancing rate (ECB Data Portal) and IMF World Economic Outlook
 * figures (IMF DataMapper). It runs only when the question names the ECB or the IMF, so the existing World Bank and
 * currency desks keep the rest. IMF estimates and projections are labeled as such. Nothing is predicted by InvestED.
 */
import { IMF_INDICATORS, loadEcbRate, loadImf, type EcbRate, type ImfCountry, type ImfIndicator, type ImfPoint } from "../macro/official";

export type MacroRequest = { kind: "ecb_rate" } | { kind: "imf"; indicator: ImfIndicator; country: ImfCountry; countryName: { en: string; he: string } };
export type MacroResult =
  | { kind: "ecb_rate"; rate: EcbRate }
  | { kind: "imf"; indicator: ImfIndicator; country: ImfCountry; countryName: { en: string; he: string }; points: ImfPoint[]; retrievedOn: string };

const ECB = /\becb\b|european central bank|הבנק המרכזי האירופי|הבנק האירופי/i;
const RATE = /\brate\b|interest|ריבית/i;
const IMF = /\bimf\b|international monetary fund|קרן המטבע/i;
const IND: [ImfIndicator, RegExp][] = [
  ["NGDP_RPCH", /gdp growth|economic growth|growth|צמיחה|צמיחת/i],
  ["PCPIPCH", /inflation|אינפלציה/i],
  ["LUR", /unemployment|אבטלה/i],
];
const COUNTRIES: { iso: ImfCountry; re: RegExp; name: { en: string; he: string } }[] = [
  { iso: "ISR", re: /\bisrael\b|ישראל/i, name: { en: "Israel", he: "ישראל" } },
  { iso: "USA", re: /\bus\b|\busa\b|united states|america|ארה"?ב|ארצות הברית|אמריקה/i, name: { en: "United States", he: "ארצות הברית" } },
  { iso: "GBR", re: /\buk\b|united kingdom|britain|בריטניה/i, name: { en: "United Kingdom", he: "בריטניה" } },
  { iso: "DEU", re: /germany|גרמניה/i, name: { en: "Germany", he: "גרמניה" } },
  { iso: "JPN", re: /japan|יפן/i, name: { en: "Japan", he: "יפן" } },
  { iso: "CHN", re: /china|סין/i, name: { en: "China", he: "סין" } },
  { iso: "IND", re: /\bindia\b|הודו/i, name: { en: "India", he: "הודו" } },
];

export function parseMacroRequest(text: string): MacroRequest | null {
  if (text.length > 120) return null;
  if (ECB.test(text) && RATE.test(text)) return { kind: "ecb_rate" };
  if (!IMF.test(text)) return null;
  const indicator = IND.find(([, re]) => re.test(text))?.[0];
  const c = COUNTRIES.find((x) => x.re.test(text));
  return indicator && c ? { kind: "imf", indicator, country: c.iso, countryName: c.name } : null;
}

export async function loadMacro(req: MacroRequest, fetcher: typeof fetch = fetch, now = new Date()): Promise<MacroResult | null> {
  if (req.kind === "ecb_rate") {
    const rate = await loadEcbRate(fetcher);
    return rate ? { kind: "ecb_rate", rate } : null;
  }
  const points = await loadImf(req.indicator, req.country, fetcher, now);
  return points ? { kind: "imf", indicator: req.indicator, country: req.country, countryName: req.countryName, points, retrievedOn: now.toISOString().slice(0, 10) } : null;
}

export const imfLabel = (i: ImfIndicator) => IMF_INDICATORS[i];
