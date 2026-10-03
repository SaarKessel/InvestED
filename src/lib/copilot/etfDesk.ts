/**
 * ETF / fund constituents from the fund's latest public N-PORT filing, through the site's own /api/sec-nport
 * (SEC EDGAR, free, official). Values are shown exactly as the fund reported them. The report date is always
 * shown: only quarter-end reports are public, about 60 days after quarter end. Funds that file no N-PORT
 * (unit investment trusts such as SPY) come back unavailable, never estimated.
 */
export interface EtfRequest { ticker: string }
export interface EtfHolding { name: string; title: string; cusip: string; isin: string; balance: number; units: string; valueUsd: number; weightPct: number; assetCategory: string; payoffProfile: string }
export interface EtfResult extends EtfRequest {
  seriesName: string; reportDate: string; filingDate: string; netAssetsUsd: number | null;
  totalHoldingCount: number; holdings: EtfHolding[]; shownWeightPct: number; sourceUrl: string;
}

const KNOWN = ["VOO", "VTI", "VXUS", "BND", "VYM", "QQQ", "IVV", "SPY", "VUG", "VTV", "SCHD", "VNQ", "IWM", "DIA", "VEA", "VWO", "AGG", "VGT", "VIG", "ARKK"];
const NOT_TICKERS = new Set(["ETF", "ETFS", "SEC", "USA", "THE", "AND", "FOR", "WHAT", "TOP", "IRA", "GDP", "CPI", "USD", "ILS", "EUR", "NIS", "FAQ", "AI"]);
const ASKS = /\b(?:holdings?|constituents?|components?|composition|inside|what(?:'s| is| are) in)\b|\bwhat does\b.*\bhold\b|מה מחזיק(?:ה)?(?![א-ת])|החזקות|מה יש (?:ב|בתוך)|הרכב|מורכב/i;

export function parseEtfRequest(text: string): EtfRequest | null {
  if (text.length > 120 || !ASKS.test(text)) return null;
  const words = text.match(/[A-Za-z]{2,6}/g) ?? [];
  const known = words.map((w) => w.toUpperCase()).find((w) => KNOWN.includes(w));
  if (known) return { ticker: known };
  // any other ticker must be typed in capitals so ordinary words are never read as tickers
  const caps = (text.match(/\b[A-Z]{3,5}\b/g) ?? []).find((w) => !NOT_TICKERS.has(w));
  return caps ? { ticker: caps } : null;
}

export async function loadEtf(req: EtfRequest, fetcher: typeof fetch = fetch): Promise<EtfResult | null> {
  try {
    const r = await fetcher(`/api/sec-nport?ticker=${encodeURIComponent(req.ticker)}&top=10`);
    if (!r.ok) return null;
    const j = (await r.json()) as { fund?: Record<string, unknown> };
    const f = j.fund;
    if (!f || !Array.isArray(f.holdings) || f.holdings.length === 0 || typeof f.reportDate !== "string" || !f.reportDate) return null;
    const holdings = (f.holdings as EtfHolding[]).filter((h) => typeof h.name === "string" && Number.isFinite(h.valueUsd) && Number.isFinite(h.weightPct));
    if (holdings.length === 0) return null;
    const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    return {
      ticker: req.ticker, seriesName: typeof f.seriesName === "string" ? f.seriesName : req.ticker, reportDate: f.reportDate,
      filingDate: typeof f.filingDate === "string" ? f.filingDate : "", netAssetsUsd: n(f.netAssetsUsd),
      totalHoldingCount: n(f.totalHoldingCount) ?? holdings.length, holdings, shownWeightPct: n(f.shownWeightPct) ?? Number(holdings.reduce((s, h) => s + h.weightPct, 0).toFixed(2)),
      sourceUrl: typeof f.sourceUrl === "string" ? f.sourceUrl : "",
    };
  } catch { return null; }
}
