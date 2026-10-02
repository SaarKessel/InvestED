// ---------------------------------------------------------------------------
// InvestED - official macro data, keyless:
//  - ECB Data Portal (SDMX): the main refinancing operations rate, with the date
//    of each change. Public, CORS-enabled, no key.
//  - IMF DataMapper (World Economic Outlook): real GDP growth, inflation and
//    unemployment. NOT a forecast by InvestED: the latest years are IMF
//    estimates and projections and are labeled as such. Reached through our
//    own pass-through because the IMF API sends no CORS headers.
// Nothing is filled in: a missing year stays missing.
// ---------------------------------------------------------------------------

export const ECB_RATE_URL = "https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.MRR_FR.LEV?lastNObservations=8&format=jsondata";

export interface EcbRatePoint { date: string; ratePct: number }
export interface EcbRate { series: EcbRatePoint[]; latest: EcbRatePoint }

/** Parse the SDMX-JSON payload. Returns null for anything that does not look like the expected single series. */
export function parseEcbRate(body: unknown): EcbRate | null {
  const b = body as { dataSets?: { series?: Record<string, { observations?: Record<string, unknown[]> }> }[]; structure?: { dimensions?: { observation?: { values?: { id?: string }[] }[] } } };
  const series = Object.values(b?.dataSets?.[0]?.series ?? {});
  const times = b?.structure?.dimensions?.observation?.[0]?.values;
  if (series.length !== 1 || !Array.isArray(times)) return null;
  const obs = series[0].observations ?? {};
  const points: EcbRatePoint[] = [];
  for (const [idx, v] of Object.entries(obs)) {
    const date = times[Number(idx)]?.id, rate = Array.isArray(v) ? v[0] : null;
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && typeof rate === "number" && Number.isFinite(rate)) points.push({ date, ratePct: rate });
  }
  points.sort((a, c) => a.date.localeCompare(c.date));
  return points.length ? { series: points, latest: points[points.length - 1] } : null;
}

export async function loadEcbRate(fetcher: typeof fetch = fetch): Promise<EcbRate | null> {
  try {
    const r = await fetcher(ECB_RATE_URL, { headers: { Accept: "application/json" } });
    return r.ok ? parseEcbRate(await r.json()) : null;
  } catch { return null; }
}

export type ImfIndicator = "NGDP_RPCH" | "PCPIPCH" | "LUR";
export const IMF_INDICATORS: Record<ImfIndicator, { en: string; he: string }> = {
  NGDP_RPCH: { en: "Real GDP growth (annual %)", he: "צמיחת התוצר הריאלי (שנתי, %)" },
  PCPIPCH: { en: "Inflation, average consumer prices (annual %)", he: "אינפלציה, מחירים לצרכן בממוצע (שנתי, %)" },
  LUR: { en: "Unemployment rate (%)", he: "שיעור אבטלה (%)" },
};
export const IMF_COUNTRIES = ["ISR", "USA", "GBR", "DEU", "JPN", "CHN", "IND"] as const;
export type ImfCountry = (typeof IMF_COUNTRIES)[number];

export interface ImfPoint { year: number; value: number; projected: boolean }

/**
 * Parse an IMF DataMapper payload for one indicator and country. `lastActualYear` is the last year that is
 * treated as reported (anything later is flagged as an IMF estimate or projection). Returns up to `count` latest points.
 */
export function parseImf(body: unknown, indicator: ImfIndicator, country: string, lastActualYear: number, count = 8): ImfPoint[] | null {
  const raw = (body as { values?: Record<string, Record<string, Record<string, unknown>>> })?.values?.[indicator]?.[country];
  if (!raw || typeof raw !== "object") return null;
  const pts: ImfPoint[] = [];
  for (const [y, v] of Object.entries(raw)) {
    const year = Number(y);
    if (year > lastActualYear + 2) continue; // far-out projections are left out
    if (Number.isInteger(year) && typeof v === "number" && Number.isFinite(v)) pts.push({ year, value: v, projected: year > lastActualYear });
  }
  pts.sort((a, b) => a.year - b.year);
  return pts.length ? pts.slice(-count) : null;
}

export async function loadImf(indicator: ImfIndicator, country: ImfCountry, fetcher: typeof fetch = fetch, now = new Date()): Promise<ImfPoint[] | null> {
  try {
    const r = await fetcher(`/api/imf-weo?indicator=${indicator}&country=${country}`);
    if (!r.ok) return null;
    // The IMF publishes estimates for the current year and projections after it, so only years before the current one count as reported.
    return parseImf(await r.json(), indicator, country, now.getUTCFullYear() - 1);
  } catch { return null; }
}
